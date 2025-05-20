from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'schedules', views.ScheduleViewSet)
router.register(r'days', views.DayViewSet)
router.register(r'hours', views.HourViewSet)
router.register(r'schedule-times', views.ScheduleTimeViewSet)
router.register(r'room-schedules', views.RoomScheduleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]