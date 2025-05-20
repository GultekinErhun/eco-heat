from django.core.management.base import BaseCommand
from schedules.models import Schedule, Day, Hour, ScheduleTime

class Command(BaseCommand):
    help = 'Creates default schedules - Default, Work, and Holiday'

    def handle(self, *args, **options):
        # Varsayılan programları oluştur
        default_schedules = [
            {
                'name': 'Default Schedule',
                'description': 'Default heating schedule for everyday use',
            },
            {
                'name': 'Work Schedule',
                'description': 'Schedule optimized for working days',
            },
            {
                'name': 'Holiday Schedule',
                'description': 'Schedule for vacation periods',
            }
        ]
        
        created_schedules = []
        
        for schedule_data in default_schedules:
            schedule, created = Schedule.objects.get_or_create(
                name=schedule_data['name'],
                defaults={'description': schedule_data['description']}
            )
            
            if created:
                created_schedules.append(schedule)
                self.stdout.write(self.style.SUCCESS(f'Created "{schedule.name}"'))
            else:
                self.stdout.write(self.style.WARNING(f'"{schedule.name}" already exists'))
        
        # Yeni oluşturulan programlar için varsayılan zaman dilimlerini oluştur
        if created_schedules:
            days = Day.objects.all()
            hours = Hour.objects.all()
            
            for schedule in created_schedules:
                self.stdout.write(f'Creating time slots for {schedule.name}...')
                
                for day in days:
                    for hour in hours:
                        # Programa, güne ve saate bağlı olarak uygun sıcaklığı belirleme
                        if schedule.name == 'Default Schedule':
                            temp = 22.0  # Gün boyu sabit sıcaklık
                            heating = True
                            fan = False
                        elif schedule.name == 'Work Schedule':
                            # Sabah 6-9 arası 22°C, gündüz 9-18 arası 20°C, akşam 18-24 arası 22°C, gece 0-6 arası 18°C
                            if hour.start_time.hour >= 6 and hour.start_time.hour < 9:
                                temp = 22.0
                                heating = True
                                fan = False
                            elif hour.start_time.hour >= 9 and hour.start_time.hour < 18:
                                temp = 20.0
                                heating = True
                                fan = True
                            elif hour.start_time.hour >= 18 or hour.start_time.hour < 0:
                                temp = 22.0
                                heating = True
                                fan = False
                            else:  # 0-6 arası
                                temp = 18.0
                                heating = True
                                fan = False
                        else:  # Holiday Schedule
                            # Tatil programında tüm gün boyunca konforlu sıcaklık
                            temp = 24.0
                            heating = True
                            fan = False
                        
                        # ScheduleTime oluştur
                        schedule_time, created = ScheduleTime.objects.get_or_create(
                            day_id=day,
                            hour_id=hour,
                            schedule_id=schedule,
                            defaults={
                                'desired_temperature': temp,
                                'is_heating_active': heating,
                                'is_fan_active': fan
                            }
                        )
                        
                        if created:
                            self.stdout.write(f'  - Created time slot: {day.day} {hour} @ {temp}°C (Heating: {heating}, Fan: {fan})')
                
                self.stdout.write(self.style.SUCCESS(f'Completed time slot creation for {schedule.name}'))
        
        self.stdout.write(self.style.SUCCESS('Default schedules setup complete!'))