from django.contrib import admin
from .models import Schedule, RoomSchedule, Day, Hour,ScheduleTime

admin.site.register(Schedule)
admin.site.register(RoomSchedule)
admin.site.register(Day)
admin.site.register(Hour)
admin.site.register(ScheduleTime)
