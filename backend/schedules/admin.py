from django.contrib import admin
from django.contrib import admin
from .models import ScheduleType, ScheduleConfig, ScheduleDay, TimeSlot

# Register your models here.
@admin.register(ScheduleType)
class ScheduleTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['created_at']

@admin.register(ScheduleConfig)
class ScheduleConfigAdmin(admin.ModelAdmin):
    list_display = ['schedule_type', 'room', 'days_mode', 'desired_temperature', 'is_active']
    list_filter = ['days_mode', 'is_active', 'presence_based']
    search_fields = ['schedule_type__name', 'room__name']

@admin.register(ScheduleDay)
class ScheduleDayAdmin(admin.ModelAdmin):
    list_display = ['schedule_config', 'day']
    list_filter = ['day']

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['schedule_config', 'type', 'start_time', 'end_time', 'is_active']
    list_filter = ['type', 'is_active']
    search_fields = ['schedule_config__schedule_type__name']