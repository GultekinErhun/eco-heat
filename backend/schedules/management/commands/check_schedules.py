# schedules/management/commands/check_schedules.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from schedules.models import ScheduleConfig, TimeSlot
from sensors.mqtt_client import mqtt_client

class Command(BaseCommand):
    help = 'Programları kontrol eder ve zamanı gelenleri uygular'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Programlar kontrol ediliyor...'))
        
        # Aktif konfigürasyonları al
        configs = ScheduleConfig.objects.filter(is_active=True)
        count = 0
        
        # Şu anki gün ve saat
        now = timezone.localtime(timezone.now())
        current_time = now.time()
        current_weekday = now.weekday()  # 0-6 (Pazartesi-Pazar)
        
        for config in configs:
            apply_schedule = False
            
            # Gün moduna göre kontrol
            if config.days_mode == 'all':
                apply_schedule = True
            elif config.days_mode == 'weekday' and current_weekday < 5:  # Hafta içi (0-4)
                apply_schedule = True
            elif config.days_mode == 'weekend' and current_weekday >= 5:  # Hafta sonu (5-6)
                apply_schedule = True
            elif config.days_mode == 'custom':
                # Özel günler kontrol edilir
                if config.days.filter(day=current_weekday).exists():
                    apply_schedule = True
            
            if apply_schedule:
                # Isıtma kontrolleri
                heating_slots = TimeSlot.objects.filter(
                    schedule_config=config, 
                    type='heating', 
                    is_active=True
                )
                
                heating_active = False
                for slot in heating_slots:
                    if slot.start_time <= current_time <= slot.end_time:
                        heating_active = True
                        break
                
                # Fan kontrolleri
                fan_slots = TimeSlot.objects.filter(
                    schedule_config=config, 
                    type='fan', 
                    is_active=True
                )
                
                fan_active = False
                for slot in fan_slots:
                    if slot.start_time <= current_time <= slot.end_time:
                        fan_active = True
                        break
                
                # MQTT komutlarını gönder
                mqtt_client.publish_valve_command(config.room.id, heating_active)
                mqtt_client.publish_fan_command(config.room.id, fan_active)
                
                count += 1
                self.stdout.write(f"Oda {config.room.name}: Isıtma={'AÇIK' if heating_active else 'KAPALI'}, Fan={'AÇIK' if fan_active else 'KAPALI'}")
        
        self.stdout.write(self.style.SUCCESS(f'Toplam {count} oda için program uygulandı.'))