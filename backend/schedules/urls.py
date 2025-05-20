from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'types', views.ScheduleTypeViewSet, basename='schedule-type')
router.register(r'configs', views.ScheduleConfigViewSet, basename='schedule-config')
router.register(r'time-slots', views.TimeSlotViewSet, basename='time-slot')
router.register(r'days', views.ScheduleDayViewSet, basename='schedule-day')

urlpatterns = [
    path('', include(router.urls)),
]