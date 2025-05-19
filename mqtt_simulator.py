import paho.mqtt.client as mqtt
import time
import random
import argparse
from datetime import datetime

def main():
    # Komut satırı argümanlarını tanımla
    parser = argparse.ArgumentParser(description='EcoHeat MQTT Veri Simülatörü')
    parser.add_argument('--broker', default='localhost', help='MQTT broker adresi')
    parser.add_argument('--port', type=int, default=1883, help='MQTT broker port')
    parser.add_argument('--interval', type=float, default=5.0, help='Veri gönderme aralığı (saniye)')
    parser.add_argument('--rooms', type=int, default=2, help='Simüle edilecek oda sayısı')
    args = parser.parse_args()
    
    # MQTT istemcisini başlat
    client = mqtt.Client()
    
    # Bağlantı olaylarını tanımla
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print(f"✅ MQTT Broker'a bağlandı: {args.broker}:{args.port}")
            
            # Komut topic'lerine abone ol
            for room_id in range(1, args.rooms + 1):
                client.subscribe(f"esp32/stepper/control/{room_id}")
                client.subscribe(f"esp32/fan/control/{room_id}")
                print(f"📡 Dinleniyor: esp32/stepper/control/{room_id}, esp32/fan/control/{room_id}")
                
            print("\n🚀 Veri simülasyonu başlıyor...")
        else:
            connection_error = {
                1: "Protokol sürümü hatası",
                2: "Geçersiz istemci tanımlayıcı",
                3: "Sunucu kullanılamıyor",
                4: "Hatalı kullanıcı adı veya şifre",
                5: "Yetkisiz"
            }
            print(f"❌ Bağlantı başarısız: {connection_error.get(rc, f'Bilinmeyen hata kodu: {rc}')}")
    
    # Mesaj alma olayını tanımla
    def on_message(client, userdata, msg):
        try:
            topic = msg.topic
            payload = msg.payload.decode().strip()
            
            print(f"\n📥 Komut alındı [{topic}]: {payload}")
            
            # Topic'i parçalara ayır
            parts = topic.split('/')
            if len(parts) < 4:
                print(f"❌ Geçersiz topic formatı: {topic}")
                return
                
            room_id = parts[3]  # esp32/stepper/control/{room_id}
            
            if "stepper/control" in topic:
                if payload == "CW":
                    print(f"🔧 Oda {room_id} için valf KAPATILDI (saat yönünde dönüş)")
                    client.publish(f"esp32/status/{room_id}", f"Stepper completed CW rotation (valve closed)")
                elif payload == "CCW":
                    print(f"🔧 Oda {room_id} için valf AÇILDI (saat yönünün tersine dönüş)")
                    client.publish(f"esp32/status/{room_id}", f"Stepper completed CCW rotation (valve open)")
                else:
                    print(f"❌ Geçersiz stepper komutu: {payload}")
            
            elif "fan/control" in topic:
                if payload == "ON":
                    print(f"💨 Oda {room_id} için fan AÇILDI")
                    client.publish(f"esp32/status/{room_id}", f"Fans: ON")
                elif payload == "OFF":
                    print(f"💨 Oda {room_id} için fan KAPATILDI")
                    client.publish(f"esp32/status/{room_id}", f"Fans: OFF")
                else:
                    print(f"❌ Geçersiz fan komutu: {payload}")
                    
        except Exception as e:
            print(f"❌ Mesaj işleme hatası: {str(e)}")
    
    # Callback fonksiyonlarını ata
    client.on_connect = on_connect
    client.on_message = on_message
    
    # Broker'a bağlan
    try:
        client.connect(args.broker, args.port, 60)
        client.loop_start()
    except Exception as e:
        print(f"❌ MQTT broker bağlantı hatası: {str(e)}")
        print("   Broker çalışıyor mu? Port doğru mu? Firewall açık mı?")
        return
    
    # Ana simülasyon döngüsü
    try:
        iteration = 0
        while True:
            iteration += 1
            print(f"\n📊 [{iteration}] Sensör verileri gönderiliyor...")
            
            for room_id in range(1, args.rooms + 1):
                # Sensör verilerini oluştur
                temperature = round(random.uniform(19.0, 25.0), 1)
                humidity = round(random.uniform(40.0, 70.0), 1)
                pir = random.choice(["0", "1"])  # 0: Hareket yok, 1: Hareket var
                
                # Sensör verilerini gönder (gerçek formata göre)
                client.publish(f"room/{room_id}/temperature", str(temperature))
                client.publish(f"room/{room_id}/humidity", str(humidity))
                client.publish(f"room/{room_id}/pir", pir)
                
                print(f"   🏠 Oda {room_id}:")
                print(f"      🌡️ Sıcaklık: {temperature}°C")
                print(f"      💧 Nem: {humidity}%")
                print(f"      👤 Hareket: {'Var' if pir == '1' else 'Yok'}")
                
                # Rastgele durum güncellemeleri gönder (düşük olasılıkla)
                if random.random() < 0.2:  # %20 olasılık
                    status_message = random.choice([
                        "System online",
                        "Battery: 85%",
                        "Network signal: Strong",
                        "Valve position: Normal"
                    ])
                    client.publish(f"esp32/status/{room_id}", status_message)
                    print(f"      📡 Durum: {status_message}")
            
            # Bir sonraki iterasyon için bekle
            print(f"\n⏱️  {args.interval} saniye bekleniyor...")
            print("---------------------------------------------------")
            time.sleep(args.interval)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Kullanıcı tarafından durduruldu (Ctrl+C)")
    finally:
        # Temiz bir şekilde kapat
        client.loop_stop()
        client.disconnect()
        print("👋 Program sonlandırıldı")

if __name__ == "__main__":
    main()