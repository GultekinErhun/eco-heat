from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, SensorReadingViewSet, DeviceStatusViewSet
from . import views

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'readings', SensorReadingViewSet, basename='sensorreading')
router.register(r'device-status', DeviceStatusViewSet, basename='devicestatus')

urlpatterns = [
    path('', include(router.urls)),

]