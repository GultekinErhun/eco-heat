from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User

class Schedule(models.Model):
    """
    Bir zamanlama programı (default, work, holiday vb.)
    """
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name


class Day(models.Model):
    """
    Haftanın günleri
    """
    id = models.AutoField(primary_key=True)
    day = models.CharField(max_length=20)
    
    def __str__(self):
        return self.day


class Hour(models.Model):
    """
    Saat dilimleri
    """
    id = models.AutoField(primary_key=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    def __str__(self):
        return f"{self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')}"
    
    class Meta:
        ordering = ['start_time']


class ScheduleTime(models.Model):
    """
    Programların belirli gün ve saatlerdeki ayarları
    """
    id = models.AutoField(primary_key=True)
    day_id = models.ForeignKey(Day, on_delete=models.CASCADE, related_name='schedule_times')
    hour_id = models.ForeignKey(Hour, on_delete=models.CASCADE, related_name='schedule_times')
    schedule_id = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='schedule_times')
    is_heating_active = models.BooleanField(default=True)
    is_fan_active = models.BooleanField(default=False)
    desired_temperature = models.FloatField(
        validators=[MinValueValidator(5.0), MaxValueValidator(40.0)],
        default=24.0
    )
    
    def __str__(self):
        return f"{self.schedule_id.name}: {self.day_id.day} {self.hour_id} - {self.desired_temperature}°C"
    
    class Meta:
        unique_together = ['day_id', 'hour_id', 'schedule_id']


class RoomSchedule(models.Model):
    """
    Oda ve programlar arasındaki ilişki - bir oda için sadece bir tane aktif program olabilir
    """
    id = models.AutoField(primary_key=True)
    room_id = models.ForeignKey('sensors.Room', on_delete=models.CASCADE, related_name='room_schedules')
    schedule_id = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='room_schedules')
    is_active = models.BooleanField(default=True)  # Default'u True yapabiliriz, çünkü bir oda için sadece bir program olacak
    
    def __str__(self):
        return f"{self.room_id.name} - {self.schedule_id.name} - {'Active' if self.is_active else 'Inactive'}"
    
    class Meta:
        unique_together = ['room_id']  # Sadece room_id için unique constraint, yani bir oda için sadece bir kayıt olabilir
        
    def save(self, *args, **kwargs):
        """
        Kaydetme işleminde eğer aktif olarak işaretlendiyse, diğer program ilişkilerini temizler
        """
        if self.is_active:
            # Odanın diğer program ilişkilerini sil
            RoomSchedule.objects.filter(room_id=self.room_id).delete()
        
        super().save(*args, **kwargs)