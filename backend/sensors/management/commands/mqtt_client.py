# sensors/management/commands/mqtt_client.py
from django.core.management.base import BaseCommand
import time
from sensors.mqtt_client import mqtt_client

class Command(BaseCommand):
    help = 'MQTT client yönetimi (başlat/durdur/durum)'
    
    def add_arguments(self, parser):
        parser.add_argument('action', choices=['start', 'stop', 'status'], 
                          help='MQTT client işlemi (start/stop/status)')
        parser.add_argument('--timeout', type=int, default=0,
                          help='Çalışma süresi (saniye), 0=sonsuz')
    
    def handle(self, *args, **options):
        """Komut çalıştırıldığında yürütülecek ana metod"""
        action = options['action']
        timeout = options['timeout']
        
        if action == 'start':
            self.stdout.write(self.style.SUCCESS("MQTT client başlatılıyor..."))
            mqtt_client.connect()
            
            if timeout > 0:
                self.stdout.write(f"MQTT client {timeout} saniye çalışacak...")
                try:
                    time.sleep(timeout)
                except KeyboardInterrupt:
                    self.stdout.write(self.style.WARNING("Klavye kesintisi algılandı"))
                finally:
                    mqtt_client.disconnect()
                    self.stdout.write(self.style.SUCCESS("MQTT client durduruldu"))
            else:
                self.stdout.write("MQTT client başlatıldı ve çalışıyor. Durdurmak için Ctrl+C tuşlarına basın...")
                try:
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    mqtt_client.disconnect()
                    self.stdout.write(self.style.SUCCESS("MQTT client durduruldu"))
        
        elif action == 'stop':
            self.stdout.write("MQTT client durduruluyor...")
            mqtt_client.disconnect()
            self.stdout.write(self.style.SUCCESS("MQTT client durduruldu"))
        
        elif action == 'status':
            if mqtt_client.is_connected:
                self.stdout.write(self.style.SUCCESS("MQTT client çalışıyor ve broker'a bağlı"))
            else:
                self.stdout.write(self.style.WARNING("MQTT client çalışmıyor veya broker'a bağlı değil"))