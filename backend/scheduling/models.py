from django.db import models
from sensors.models import Room

class Schedule(models.Model):
    SCHEDULE_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('work', 'Work Schedule'),
        ('holiday', 'Holiday Schedule'),
    ]
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    schedule_type = models.CharField(max_length=20, choices=SCHEDULE_TYPES)
    desired_temp = models.FloatField()
    
    # Zaman aralıkları için JSON field
    time_slots = models.JSONField()
    # Örnek: [{"start": "06:00", "end": "08:00", "days": [1,2,3,4,5]}]
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.room.name}"