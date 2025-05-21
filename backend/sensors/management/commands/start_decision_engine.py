from django.core.management.base import BaseCommand
from schedules.decision_engine import decision_engine

class Command(BaseCommand):
    help = 'Decision Engine\'i manuel olarak başlatır veya durdurur'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            type=str,
            choices=['start', 'stop', 'status'],
            help='Gerçekleştirilecek eylem: start, stop veya status'
        )

    def handle(self, *args, **options):
        action = options['action']
        
        if action == 'start':
            decision_engine.start()
            self.stdout.write(self.style.SUCCESS('Decision Engine başlatıldı!'))
        
        elif action == 'stop':
            decision_engine.stop()
            self.stdout.write(self.style.SUCCESS('Decision Engine durduruldu!'))
        
        elif action == 'status':
            status = 'Çalışıyor' if decision_engine.running else 'Durduruldu'
            self.stdout.write(self.style.SUCCESS(f'Decision Engine durumu: {status}'))