from django.contrib import admin
from .models import Room, SensorReading, DeviceStatus

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at']
    list_filter = ['user', 'created_at']
    search_fields = ['name', 'user__username']

@admin.register(SensorReading)
class SensorReadingAdmin(admin.ModelAdmin):
    list_display = ['room', 'temperature', 'humidity', 'presence', 'timestamp']
    list_filter = ['room', 'presence', 'timestamp']
    search_fields = ['room__name']
    date_hierarchy = 'timestamp'

@admin.register(DeviceStatus)
class DeviceStatusAdmin(admin.ModelAdmin):
    list_display = ['room', 'valve_status', 'fan_status', 'battery_level', 'connection_status', 'last_updated']
    list_filter = ['valve_status', 'fan_status', 'connection_status']
    search_fields = ['room__name']