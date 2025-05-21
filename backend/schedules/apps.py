# schedules/apps.py
from django.apps import AppConfig



class SchedulesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'schedules'

    def ready(self):
        from . import scheduler
        scheduler.start()


        import os
        if os.environ.get('RUN_MAIN', None) != 'true':  # Geliştirme sunucusundaki çift-yüklemeyi önle
            try:
                from .decision_engine import decision_engine
                decision_engine.start()
                print("Decision Engine başlatıldı!")
            except Exception as e:
                print(f"Decision Engine başlatılırken hata: {e}")

# Django uygulaması kapatıldığında çağrılacak işlev
def on_shutdown():
    try:
        from .decision_engine import decision_engine
        decision_engine.stop()
        print("Decision Engine durduruldu!")
    except Exception as e:
        print(f"Decision Engine durdurulurken hata: {e}")

# Kapatma işlevini kaydet
import atexit
atexit.register(on_shutdown)