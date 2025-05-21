# schedules/decision_engine.py
import logging
import threading
import time
from django.utils import timezone
from django.db.models import F, Q
from django.conf import settings

logger = logging.getLogger(__name__)

class DecisionEngine:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DecisionEngine, cls).__new__(cls)
            cls._instance.running = False
            engine_settings = getattr(settings, 'DECISION_ENGINE', {})
            cls._instance.check_interval = engine_settings.get('CHECK_INTERVAL', 60)
            cls._instance.temperature_threshold = engine_settings.get('TEMPERATURE_THRESHOLD', 2.0)
            cls._instance.daemon_thread = None
        return cls._instance
    
    def start(self):
        """Karar motoru daemon thread'ini başlat"""
        if self.running:
            logger.info("Karar motoru zaten çalışıyor")
            return
        
        self.running = True
        self.daemon_thread = threading.Thread(target=self._run_decision_loop)
        self.daemon_thread.daemon = True
        self.daemon_thread.start()
        logger.info("Karar motoru başlatıldı")
    
    def stop(self):
        """Karar motoru daemon thread'ini durdur"""
        if not self.running:
            logger.info("Karar motoru zaten durduruldu")
            return
        
        self.running = False
        if self.daemon_thread and self.daemon_thread.is_alive():
            self.daemon_thread.join(2.0)  # Maksimum 2 saniye bekle
        logger.info("Karar motoru durduruldu")
    
    def _run_decision_loop(self):
        """Ana karar döngüsü"""
        logger.info("Karar motoru döngüsü başlatıldı")
        
        # Geç import yaparak döngüsel import hatalarından kaçınıyoruz
        from schedules.models import Schedule, ScheduleTime, RoomSchedule
        from sensors.models import Room, SensorReading, DeviceStatus
        from sensors.mqtt_client import mqtt_client
        
        while self.running:
            try:
                self._process_all_rooms()
            except Exception as e:
                logger.error(f"Karar motoru hatası: {str(e)}", exc_info=True)
            
            # Bir sonraki kontrol zamanına kadar bekle
            time.sleep(self.check_interval)
    
    def _process_all_rooms(self):
        """Tüm odalar için ısıtma ve fan kararlarını ver"""
        # Geç import yaparak döngüsel import hatalarından kaçınıyoruz
        from sensors.models import Room
        
        # Tüm odaları al
        rooms = Room.objects.all()
        logger.info(f"Toplam {rooms.count()} oda kontrol ediliyor")
        
        for room in rooms:
            try:
                self._process_room(room)
            except Exception as e:
                logger.error(f"Oda {room.id} işlenirken hata: {str(e)}")
    
    def _process_room(self, room):
        """Belirli bir oda için ısıtma ve fan kararlarını ver"""
        # Geç import yaparak döngüsel import hatalarından kaçınıyoruz
        from sensors.models import SensorReading, DeviceStatus
        from schedules.models import RoomSchedule
        from sensors.mqtt_client import mqtt_client
        
        # Son sensör verilerini al
        latest_reading = SensorReading.objects.filter(room=room).order_by('-timestamp').first()
        if not latest_reading:
            logger.warning(f"Oda {room.id} için sensör verisi bulunamadı, atlanıyor")
            return
        
        # Oda cihaz durumunu al
        device_status, created = DeviceStatus.objects.get_or_create(room=room)
        
        # Kontrol modlarını kontrol et
        heating_schedule_active = device_status.heating_control_mode == 'schedule'
        fan_schedule_active = device_status.fan_control_mode == 'schedule'
        
        # Eğer her iki sistem de manuel kontroldeyse, hiçbir şey yapma
        if not heating_schedule_active and not fan_schedule_active:
            logger.debug(f"Oda {room.id} için tüm sistemler manuel kontrol modunda, atlanıyor")
            return
        
        # Aktif programı kontrol et
        active_schedule = self._get_active_schedule(room)
        
        # Eğer aktif program yoksa, atla
        if not active_schedule:
            logger.warning(f"Oda {room.id} için aktif program bulunamadı, atlanıyor")
            return
        
        # Şu anki gün ve saat için program ayarlarını bul
        current_time_slot = self._get_current_time_slot(active_schedule)
        if not current_time_slot:
            logger.warning(f"Oda {room.id} için aktif zaman dilimi bulunamadı, atlanıyor")
            return
        
        # Sıcaklık hedefini ve fan/ısıtma ayarlarını al
        desired_temperature = current_time_slot.desired_temperature
        is_heating_active = current_time_slot.is_heating_active
        is_fan_active = current_time_slot.is_fan_active
        
        # Mevcut sıcaklığı al
        current_temperature = latest_reading.temperature
        
        # Isıtma kontrolü (sadece schedule modundaysa)
        if heating_schedule_active:
            if is_heating_active:
                # Sıcaklık kontrol toleransına göre ısıtmayı açıp kapat
                if current_temperature < desired_temperature - self.temperature_threshold:
                    # Sıcaklık düşük, ısıtmayı aç
                    self._control_heating(room.id, True)
                elif current_temperature > desired_temperature + self.temperature_threshold:
                    # Sıcaklık yüksek, ısıtmayı kapat
                    self._control_heating(room.id, False)
            else:
                # Isıtma programda kapalı, kapalı tut
                self._control_heating(room.id, False)
            
            logger.info(
                f"Oda {room.id} ısıtma - Şu anki: {current_temperature}°C, Hedef: {desired_temperature}°C, "
                f"Program Aktif: {is_heating_active}, Vana: {'Açık' if device_status.valve_status else 'Kapalı'}"
            )
        
        # Fan kontrolü (sadece schedule modundaysa)
        if fan_schedule_active:
            # Fan durumunu programdan al
            if is_fan_active != device_status.fan_status:
                self._control_fan(room.id, is_fan_active)
            
            logger.info(
                f"Oda {room.id} fan - Program Aktif: {is_fan_active}, "
                f"Fan: {'Açık' if device_status.fan_status else 'Kapalı'}"
            )
    
    def _get_active_schedule(self, room):
        """Oda için aktif programı bul"""
        from schedules.models import RoomSchedule
        try:
            active_room_schedule = RoomSchedule.objects.get(room_id=room, is_active=True)
            return active_room_schedule.schedule_id
        except RoomSchedule.DoesNotExist:
            return None
    
    def _get_current_time_slot(self, schedule):
        """Şu anki gün ve saat için program ayarlarını bul"""
        from schedules.models import ScheduleTime
        from django.db.models import F
        
        now = timezone.now()
        
        # Şu anki günü bul (1-7, Pazartesi-Pazar)
        current_day_of_week = now.weekday() + 1  # Django günleri 0-6, biz 1-7 kullanıyoruz
        current_time = now.time()
        
        # Günü ve şu anki saate uygun program ayarını bul
        try:
            return ScheduleTime.objects.filter(
                schedule_id=schedule,
                day_id=current_day_of_week,
                hour_id__start_time__lte=current_time,
                hour_id__end_time__gte=current_time
            ).first()
        except Exception as e:
            logger.error(f"Zaman dilimi bulma hatası: {str(e)}")
            return None
    
    def _control_heating(self, room_id, turn_on):
        """Isıtma kontrolü (vanaları aç/kapat)"""
        from sensors.models import DeviceStatus
        from sensors.mqtt_client import mqtt_client
        
        # Mevcut durumu kontrol et
        try:
            device_status = DeviceStatus.objects.get(room_id=room_id)
            
            # Eğer durum zaten istenilen gibi ise, işlem yapma
            if device_status.valve_status == turn_on:
                return
            
            # MQTT ile vanayı kontrol et
            if mqtt_client.is_connected and mqtt_client.publish_valve_command(room_id, turn_on):
                # Veritabanındaki durumu güncelle
                device_status.valve_status = turn_on
                device_status.save(update_fields=['valve_status', 'last_updated'])
                
                logger.info(f"Oda {room_id} - Vana durumu güncellendi: {'Açık' if turn_on else 'Kapalı'}")
            else:
                logger.warning(f"Oda {room_id} için MQTT vana komutu gönderilemedi")
        except DeviceStatus.DoesNotExist:
            logger.warning(f"Oda {room_id} için cihaz durumu bulunamadı")
    
    def _control_fan(self, room_id, turn_on):
        """Fan kontrolü (fanları aç/kapat)"""
        from sensors.models import DeviceStatus
        from sensors.mqtt_client import mqtt_client
        
        # Mevcut durumu kontrol et
        try:
            device_status = DeviceStatus.objects.get(room_id=room_id)
            
            # Eğer durum zaten istenilen gibi ise, işlem yapma
            if device_status.fan_status == turn_on:
                return
            
            # MQTT ile fanı kontrol et
            if mqtt_client.is_connected and mqtt_client.publish_fan_command(room_id, turn_on):
                # Veritabanındaki durumu güncelle
                device_status.fan_status = turn_on
                device_status.save(update_fields=['fan_status', 'last_updated'])
                
                logger.info(f"Oda {room_id} için fan durumu güncellendi: {'Açık' if turn_on else 'Kapalı'}")
            else:
                logger.warning(f"Oda {room_id} için MQTT fan komutu gönderilemedi")
        except DeviceStatus.DoesNotExist:
            logger.warning(f"Oda {room_id} için cihaz durumu bulunamadı")

# Singleton instance
decision_engine = DecisionEngine()