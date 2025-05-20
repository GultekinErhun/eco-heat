from django.db import models
from django.contrib.auth.models import User
from sensors.models import Room

class ScheduleType(models.Model):
    """Program tipi (Varsayılan, İş, Tatil vb.)"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"

class ScheduleConfig(models.Model):
    """Program konfigürasyonu"""
    DAYS_CHOICES = [
        ('all', 'Tüm Hafta'),
        ('weekday', 'Hafta İçi'),
        ('weekend', 'Hafta Sonu'),
        ('custom', 'Özel Günler'),
    ]
    
    schedule_type = models.ForeignKey(ScheduleType, on_delete=models.CASCADE, related_name="configs")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="schedule_configs")
    days_mode = models.CharField(max_length=10, choices=DAYS_CHOICES, default='all')
    desired_temperature = models.FloatField(default=22.0)  # Varsayılan 22°C
    presence_based = models.BooleanField(default=False)  # Hareket sensörüne göre çalışsın mı?
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.schedule_type.name} - {self.room.name}"
    
    class Meta:
        unique_together = ('schedule_type', 'room')

class ScheduleDay(models.Model):
    """Programın uygulanacağı özel günler (days_mode='custom' ise)"""
    DAYS = [
        (0, 'Pazartesi'),
        (1, 'Salı'),
        (2, 'Çarşamba'),
        (3, 'Perşembe'),
        (4, 'Cuma'),
        (5, 'Cumartesi'),
        (6, 'Pazar'),
    ]
    
    schedule_config = models.ForeignKey(ScheduleConfig, on_delete=models.CASCADE, related_name="days")
    day = models.IntegerField(choices=DAYS)
    
    def __str__(self):
        return f"{self.schedule_config.schedule_type.name} - {self.get_day_display()}"
    
    class Meta:
        unique_together = ('schedule_config', 'day')

class TimeSlot(models.Model):
    """Programdaki zaman dilimleri"""
    TYPE_CHOICES = [
        ('heating', 'Isıtma'),
        ('fan', 'Fan'),
    ]
    
    schedule_config = models.ForeignKey(ScheduleConfig, on_delete=models.CASCADE, related_name="time_slots")
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)  # Bu zaman diliminde aktif mi?
    
    def __str__(self):
        return f"{self.schedule_config.schedule_type.name} - {self.type} - {self.start_time} to {self.end_time}"