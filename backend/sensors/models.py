from django.db import models
from django.contrib.auth.models import User

class Room(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"

class SensorReading(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    temperature = models.FloatField()
    humidity = models.FloatField()
    presence = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.room.name}: {self.temperature}°C, {self.humidity}% at {self.timestamp}"

class DeviceStatus(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='device_status')
    valve_status = models.BooleanField(default=False)
    fan_status = models.BooleanField(default=False)
    battery_level = models.IntegerField(default=100)
    connection_status = models.CharField(max_length=20, default='stable')
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.room.name} - Battery: {self.battery_level}%, Connection: {self.connection_status}"
    
    class Meta:
        verbose_name = "Device Status"
        verbose_name_plural = "Device Statuses" 