import signal
import sys
from django.core.management.commands.runserver import Command as RunserverCommand
from schedules.decision_engine import decision_engine

class Command(RunserverCommand):
    help = 'Decision Engine ile birlikte Django geliştirme sunucusunu çalıştırır'

    def handle(self, *args, **options):
        # SIGINT (Ctrl+C) ve SIGTERM sinyallerini yakalayıcılar
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Karar motorunu başlat
        decision_engine.start()
        
        # Orijinal runserver komutunu çalıştır
        super().handle(*args, **options)
    
    def signal_handler(self, sig, frame):
        print('\nSunucu kapatılıyor...')
        decision_engine.stop()
        sys.exit(0)