from django.apps import AppConfig

class SensorsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sensors'
    
    def ready(self):
        # Uygulamayı yeniden yüklerken tekrar çalışmaması için kontrol
        import sys
        if 'runserver' not in sys.argv:
            return
            
        # MQTT client'ı başlat
        try:
            from .mqtt_client import mqtt_client
            mqtt_client.connect()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"MQTT client başlatılamadı: {str(e)}")