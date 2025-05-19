# sensors/mqtt_client.py
import paho.mqtt.client as mqtt
import logging
import json
import threading
import time
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from .models import Room, SensorReading, DeviceStatus

logger = logging.getLogger(__name__)

class MQTTClient:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MQTTClient, cls).__new__(cls)
            cls._instance.client = None
            cls._instance.is_connected = False
            cls._instance.temp_cache = {}  # Geçici veri önbelleği (sensör verileri için)
            cls._instance.subscribed_rooms = set()  # Abone olunan odaların ID'leri
            cls._instance.check_rooms_thread = None  # Oda kontrolü için thread
            cls._instance.running = False  # Thread kontrol bayrağı
        return cls._instance
    
    def connect(self):
        """MQTT broker'a bağlan ve topic'lere abone ol"""
        if self.is_connected:
            return
        
        # MQTT client oluştur
        self.client = mqtt.Client()
        
        # Callback fonksiyonlarını ayarla
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        
        # MQTT broker bilgileri
        mqtt_broker = getattr(settings, 'MQTT_BROKER', 'localhost')
        mqtt_port = getattr(settings, 'MQTT_PORT', 1883)
        mqtt_keepalive = getattr(settings, 'MQTT_KEEPALIVE', 60)
        
        logger.info(f"MQTT broker'a bağlanılıyor: {mqtt_broker}:{mqtt_port}")
        
        try:
            # MQTT broker'a bağlan
            self.client.connect(mqtt_broker, mqtt_port, mqtt_keepalive)
            
            # İstemciyi başlat (non-blocking mode)
            self.client.loop_start()
            
            # Oda kontrolü için periyodik thread başlat
            self.running = True
            self.check_rooms_thread = threading.Thread(target=self._check_new_rooms_periodically)
            self.check_rooms_thread.daemon = True
            self.check_rooms_thread.start()
            
        except Exception as e:
            logger.error(f"MQTT bağlantı hatası: {str(e)}")
    
    def disconnect(self):
        """MQTT bağlantısını kapat"""
        # Thread'i durdur
        self.running = False
        if self.check_rooms_thread and self.check_rooms_thread.is_alive():
            self.check_rooms_thread.join(2.0)  # Maksimum 2 saniye bekle
        
        # MQTT client'ı durdur
        if self.client and self.is_connected:
            self.client.loop_stop()
            self.client.disconnect()
            self.is_connected = False
            logger.info("MQTT broker bağlantısı kapatıldı")
    
    def _subscribe_to_room_topics(self, room_id):
        """Belirli bir oda için tüm topic'lere abone ol"""
        if room_id in self.subscribed_rooms:
            return False  # Zaten abone
        
        # Oda topic'lerine abone ol
        self.client.subscribe(f"room/{room_id}/temperature")
        self.client.subscribe(f"room/{room_id}/humidity")
        self.client.subscribe(f"room/{room_id}/pir")
        self.client.subscribe(f"esp32/status/{room_id}")
        
        # Abone olunan odalar listesine ekle
        self.subscribed_rooms.add(room_id)
        logger.info(f"Oda {room_id} için topic'lere abone olundu")
        return True
    
    def _check_new_rooms_periodically(self):
        """Periyodik olarak veritabanındaki yeni odaları kontrol et ve abone ol"""
        while self.running:
            try:
                if self.is_connected:
                    # Veritabanındaki tüm odaları kontrol et
                    db_rooms = Room.objects.all()
                    for room in db_rooms:
                        if room.id not in self.subscribed_rooms:
                            self._subscribe_to_room_topics(room.id)
                    
                    # Abone olunmayıp veritabanında olmayan oda ID'lerini log'a yaz
                    db_room_ids = set(room.id for room in db_rooms)
                    non_db_subscriptions = self.subscribed_rooms - db_room_ids
                    if non_db_subscriptions:
                        logger.debug(f"Veritabanında olmayan odalar için abonelikler: {non_db_subscriptions}")
            except Exception as e:
                logger.error(f"Oda kontrolü sırasında hata: {str(e)}")
            
            # 60 saniye bekle
            time.sleep(60)
    
    def on_connect(self, client, userdata, flags, rc):
        """Broker'a bağlandığında çağrılır"""
        if rc == 0:
            self.is_connected = True
            logger.info("MQTT broker'a başarıyla bağlandı")
            
            # Tüm odalar için sensör topic'lerine abone ol
            try:
                rooms = Room.objects.all()
                
                # Eğer veritabanında oda yoksa, varsayılan odaları dinle
                if not rooms.exists():
                    logger.info("Veritabanında oda bulunamadı, varsayılan odalar için abone olunuyor")
                    default_rooms = range(1, 21)  # 1-20 arası odalar için abone ol
                    for room_id in default_rooms:
                        self._subscribe_to_room_topics(room_id)
                else:
                    # Veritabanındaki tüm odalar için abone ol
                    for room in rooms:
                        self._subscribe_to_room_topics(room.id)
                
                # Ayrıca 1-20 arasındaki tüm odalar için otomatik abone ol
                # Bu, simülatör çalıştırılırken henüz veritabanında kayıtlı olmayan odaları da dinlemeyi sağlar
                for room_id in range(1, 21):
                    if room_id not in self.subscribed_rooms:
                        self._subscribe_to_room_topics(room_id)
                
                logger.info(f"Toplam {len(self.subscribed_rooms)} oda için topic'lere abone olundu")
                
            except Exception as e:
                logger.error(f"Oda aboneliği sırasında hata: {str(e)}")
        else:
            self.is_connected = False
            connection_errors = {
                1: "Protokol sürümü hatası",
                2: "Geçersiz istemci tanımlayıcı",
                3: "Sunucu kullanılamıyor",
                4: "Hatalı kullanıcı adı veya şifre",
                5: "Yetkisiz"
            }
            error_msg = connection_errors.get(rc, f"Bilinmeyen hata kodu: {rc}")
            logger.error(f"MQTT broker'a bağlanılamadı: {error_msg}")
    
    def on_disconnect(self, client, userdata, rc):
        """Broker bağlantısı kesildiğinde çağrılır"""
        self.is_connected = False
        if rc != 0:
            logger.warning(f"Beklenmeyen MQTT bağlantı kesintisi, hata kodu: {rc}")
        else:
            logger.info("MQTT bağlantısı kapatıldı")
    
    def on_message(self, client, userdata, msg):
        """Mesaj alındığında çağrılır"""
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8').strip()
            
            logger.debug(f"MQTT mesajı alındı: {topic} => {payload}")
            
            # Topic'i parçalara ayır
            parts = topic.split('/')
            
            # Sensör verileri: room/{room_id}/temperature|humidity|pir
            if parts[0] == 'room' and len(parts) == 3:
                room_id = parts[1]
                sensor_type = parts[2]
                
                # Otomatik olarak bu oda için topic'lere abone ol (henüz abone değilse)
                if int(room_id) not in self.subscribed_rooms:
                    self._subscribe_to_room_topics(int(room_id))
                
                # Sensör verisini önbelleğe al
                self._cache_sensor_data(room_id, sensor_type, payload)
                
                # Eğer önbellekte tüm sensör verileri varsa, veritabanına kaydet
                self._process_cached_data(room_id)
            
            # Cihaz durum mesajları: esp32/status/{room_id}
            elif parts[0] == 'esp32' and parts[1] == 'status' and len(parts) == 3:
                room_id = parts[2]
                
                # Otomatik olarak bu oda için topic'lere abone ol (henüz abone değilse)
                if int(room_id) not in self.subscribed_rooms:
                    self._subscribe_to_room_topics(int(room_id))
                
                self._process_device_status(room_id, payload)
            
        except Exception as e:
            logger.error(f"MQTT mesaj işleme hatası: {str(e)}", exc_info=True)
    
    def _cache_sensor_data(self, room_id, sensor_type, payload):
        """Sensör verilerini önbelleğe al"""
        # Oda için önbellek oluştur
        if room_id not in self.temp_cache:
            self.temp_cache[room_id] = {
                'timestamp': timezone.now(),
                'data': {}
            }
        
        # Sensör tipine göre veriyi önbelleğe ekle
        try:
            if sensor_type == 'temperature':
                self.temp_cache[room_id]['data']['temperature'] = float(payload)
            elif sensor_type == 'humidity':
                self.temp_cache[room_id]['data']['humidity'] = float(payload)
            elif sensor_type == 'pir':
                self.temp_cache[room_id]['data']['presence'] = (payload == '1')
            
            logger.debug(f"Sensör verisi önbelleğe alındı: Oda {room_id}, {sensor_type}={payload}")
        except ValueError:
            logger.warning(f"Geçersiz sensör değeri: {sensor_type}={payload}")
    
    def _process_cached_data(self, room_id):
        """Önbellekteki verileri işle ve gerekirse veritabanına kaydet"""
        if room_id not in self.temp_cache:
            return
        
        cache_data = self.temp_cache[room_id]
        data = cache_data['data']
        
        # Minimum gerekli alanları kontrol et (sıcaklık ve nem)
        if 'temperature' in data and 'humidity' in data:
            # Veritabanına kaydet
            self._save_sensor_data_to_db(room_id, data)
            
            # Önbelleği temizle
            del self.temp_cache[room_id]
        else:
            # 60 saniyeden eski verileri sil (eksik veri için)
            time_diff = (timezone.now() - cache_data['timestamp']).total_seconds()
            if time_diff > 60:
                logger.warning(f"Oda {room_id} için eksik sensör verileri, önbellek temizleniyor")
                del self.temp_cache[room_id]
    
    @transaction.atomic
    def _save_sensor_data_to_db(self, room_id, data):
        """Sensör verilerini veritabanına kaydet"""
        try:
            # Odayı bul veya oluştur
            try:
                room = Room.objects.get(id=room_id)
            except Room.DoesNotExist:
                # İlk kullanıcıyı bul (varsayılan admin)
                from django.contrib.auth.models import User
                admin_user = User.objects.filter(is_superuser=True).first()
                
                if not admin_user:
                    logger.error(f"Oda {room_id} için kullanıcı bulunamadı, veri kaydedilemedi")
                    return
                
                # Yeni oda oluştur
                room = Room.objects.create(
                    id=room_id,
                    name=f"Oda {room_id}",
                    user=admin_user
                )
                logger.info(f"Yeni oda oluşturuldu: {room}")
            
            # Sensör verilerini kaydet
            temperature = data.get('temperature')
            humidity = data.get('humidity')
            presence = data.get('presence', False)
            
            sensor_reading = SensorReading.objects.create(
                room=room,
                temperature=temperature,
                humidity=humidity,
                presence=presence
            )
            
            logger.info(f"Sensör verisi kaydedildi: Oda={room.name}, Sıcaklık={temperature}°C, Nem={humidity}%, Hareket={'Var' if presence else 'Yok'}")
            
            return sensor_reading
        except Exception as e:
            logger.error(f"Veritabanına kayıt hatası: {str(e)}")
            raise
    
    @transaction.atomic
    def _process_device_status(self, room_id, payload):
        """Cihaz durum mesajlarını işle ve veritabanına kaydet"""
        try:
            # Odayı bul veya oluştur
            try:
                room = Room.objects.get(id=room_id)
            except Room.DoesNotExist:
                # İlk kullanıcıyı bul (varsayılan admin)
                from django.contrib.auth.models import User
                admin_user = User.objects.filter(is_superuser=True).first()
                
                if not admin_user:
                    logger.error(f"Oda {room_id} için kullanıcı bulunamadı, veri kaydedilemedi")
                    return
                
                # Yeni oda oluştur
                room = Room.objects.create(
                    id=room_id,
                    name=f"Oda {room_id}",
                    user=admin_user
                )
                logger.info(f"Yeni oda oluşturuldu: {room}")
            
            # Cihaz durumunu al veya oluştur
            device_status, created = DeviceStatus.objects.get_or_create(room=room)
            
            # Gelen mesaja göre durum bilgilerini güncelle
            status_updated = False
            
            # Fan durumu kontrolü
            if "Fans: ON" in payload:
                device_status.fan_status = True
                status_updated = True
                logger.info(f"Fan durumu güncellendi: Oda={room.name}, Durum=AÇIK")
            elif "Fans: OFF" in payload:
                device_status.fan_status = False
                status_updated = True
                logger.info(f"Fan durumu güncellendi: Oda={room.name}, Durum=KAPALI")
            
            # Valf durumu kontrolü
            if "Stepper completed CW" in payload:  # Clockwise = Kapalı
                device_status.valve_status = False
                status_updated = True
                logger.info(f"Valf durumu güncellendi: Oda={room.name}, Durum=KAPALI")
            elif "Stepper completed CCW" in payload:  # Counter-Clockwise = Açık
                device_status.valve_status = True
                status_updated = True
                logger.info(f"Valf durumu güncellendi: Oda={room.name}, Durum=AÇIK")
            
            # Batarya seviyesi kontrolü
            if "Battery:" in payload:
                try:
                    battery_text = payload.split("Battery:")[1].strip()
                    if "%" in battery_text:
                        battery_level = int(battery_text.split("%")[0].strip())
                        device_status.battery_level = battery_level
                        status_updated = True
                        logger.info(f"Batarya seviyesi güncellendi: Oda={room.name}, Seviye=%{battery_level}")
                except (IndexError, ValueError) as e:
                    logger.warning(f"Batarya seviyesi ayrıştırılamadı: {payload}, Hata: {e}")
            
            # Bağlantı durumu kontrolü
            if "Network signal:" in payload:
                if "Strong" in payload:
                    device_status.connection_status = "stable"
                    status_updated = True
                elif "Weak" in payload:
                    device_status.connection_status = "weak"
                    status_updated = True
                else:
                    device_status.connection_status = "unstable"
                    status_updated = True
                logger.info(f"Bağlantı durumu güncellendi: Oda={room.name}, Durum={device_status.connection_status}")
            
            # Eğer herhangi bir değişiklik olduysa, kaydı güncelle
            if status_updated:
                device_status.save()
                logger.debug(f"Cihaz durumu veritabanına kaydedildi: {device_status}")
        
        except Exception as e:
            logger.error(f"Cihaz durumu işleme hatası: {str(e)}")
    
    # Komut gönderme fonksiyonları
    
    def publish_valve_command(self, room_id, open_valve):
        """Valf kontrol komutu gönder"""
        if not self.is_connected:
            logger.warning("MQTT broker'a bağlı değil, valf komutu gönderilemedi")
            return False
        
        # Valf açma/kapama komutu (CW=Kapat, CCW=Aç)
        command = "CCW" if open_valve else "CW"
        topic = f"esp32/stepper/control/{room_id}"
        
        # Komutu gönder
        result = self.client.publish(topic, command)
        
        if result.rc == 0:  # MQTT_ERR_SUCCESS
            logger.info(f"Valf komutu gönderildi: Oda={room_id}, Komut={command} ({'Aç' if open_valve else 'Kapat'})")
            return True
        else:
            logger.error(f"Valf komutu gönderilemedi: {topic}, Hata kodu: {result.rc}")
            return False
    
    def publish_fan_command(self, room_id, turn_on):
        """Fan kontrol komutu gönder"""
        if not self.is_connected:
            logger.warning("MQTT broker'a bağlı değil, fan komutu gönderilemedi")
            return False
        
        # Fan açma/kapama komutu
        command = "ON" if turn_on else "OFF"
        topic = f"esp32/fan/control/{room_id}"
        
        # Komutu gönder
        result = self.client.publish(topic, command)
        
        if result.rc == 0:  # MQTT_ERR_SUCCESS
            logger.info(f"Fan komutu gönderildi: Oda={room_id}, Komut={command}")
            return True
        else:
            logger.error(f"Fan komutu gönderilemedi: {topic}, Hata kodu: {result.rc}")
            return False

# Singleton instance oluştur
mqtt_client = MQTTClient()