# schedules/management/commands/create_default_schedules.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from schedules.models import ScheduleType

class Command(BaseCommand):
    help = 'Varsayılan program tiplerini oluşturur'
    
    def handle(self, *args, **options):
        # İlk admin kullanıcısını bul
        try:
            admin = User.objects.filter(is_superuser=True).first()
            
            if not admin:
                self.stdout.write(self.style.ERROR('Admin kullanıcısı bulunamadı!'))
                return
            
            # Varsayılan program tipleri
            default_types = [
                {
                    'name': 'Varsayılan Program',
                    'description': 'Genel kullanım için varsayılan program'
                },
                {
                    'name': 'İş Programı',
                    'description': 'İş günleri için optimize edilmiş program'
                },
                {
                    'name': 'Tatil Programı',
                    'description': 'Tatil günleri veya uzun süre evde olunacak zamanlar için program'
                }
            ]
            
            created = 0
            for type_info in default_types:
                schedule_type, created_now = ScheduleType.objects.get_or_create(
                    name=type_info['name'],
                    user=admin,
                    defaults={'description': type_info['description']}
                )
                
                if created_now:
                    created += 1
                    self.stdout.write(f"Program tipi oluşturuldu: {schedule_type.name}")
            
            self.stdout.write(self.style.SUCCESS(f'Toplam {created} varsayılan program tipi oluşturuldu.'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Hata oluştu: {str(e)}'))