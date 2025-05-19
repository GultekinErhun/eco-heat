from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Room, SensorReading, DeviceStatus
from .serializers import RoomSerializer, SensorReadingSerializer, DeviceStatusSerializer

class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Room.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def current_status(self, request, pk=None):
        room = self.get_object()
        
        # En son sensor okumalarını al
        latest_reading = SensorReading.objects.filter(
            room=room
        ).order_by('-timestamp').first()
        
        # Cihaz durumunu al
        device_status = DeviceStatus.objects.filter(room=room).first()
        
        return Response({
            'temperature': latest_reading.temperature if latest_reading else None,
            'humidity': latest_reading.humidity if latest_reading else None,
            'presence': latest_reading.presence if latest_reading else False,
            'valve_status': device_status.valve_status if device_status else False,
            'fan_status': device_status.fan_status if device_status else False,
            'battery_level': device_status.battery_level if device_status else 0,
            'connection_status': device_status.connection_status if device_status else 'unknown',
        })
    
    @action(detail=True, methods=['post'])
    def control_valve(self, request, pk=None):
        room = self.get_object()
        valve_status = request.data.get('valve_status', False)
        
        device_status, created = DeviceStatus.objects.get_or_create(room=room)
        device_status.valve_status = valve_status
        device_status.save()
        
        return Response({'status': 'valve status updated'})
    
    @action(detail=True, methods=['post'])
    def control_fan(self, request, pk=None):
        room = self.get_object()
        fan_status = request.data.get('fan_status', False)
        
        device_status, created = DeviceStatus.objects.get_or_create(room=room)
        device_status.fan_status = fan_status
        device_status.save()
        
        return Response({'status': 'fan status updated'})
    
    from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .mqtt_client import mqtt_client

# RoomViewSet sınıfında valf kontrolü için:
@action(detail=True, methods=['post'])
def control_valve(self, request, pk=None):
    """Valf kontrolü için MQTT komutu gönderir"""
    room = self.get_object()
    valve_status = request.data.get('valve_status', False)
    
    # MQTT üzerinden gönder
    success = mqtt_client.publish_valve_command(room.id, valve_status)
    
    if success:
        return Response({
            'success': True,
            'message': f"Valf {'açma' if valve_status else 'kapama'} komutu gönderildi",
            'valve_status': valve_status
        })
    else:
        return Response({
            'success': False,
            'message': 'MQTT komutu gönderilemedi'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# RoomViewSet sınıfında fan kontrolü için:
@action(detail=True, methods=['post'])
def control_fan(self, request, pk=None):
    """Fan kontrolü için MQTT komutu gönderir"""
    room = self.get_object()
    fan_status = request.data.get('fan_status', False)
    
    # MQTT üzerinden gönder
    success = mqtt_client.publish_fan_command(room.id, fan_status)
    
    if success:
        return Response({
            'success': True,
            'message': f"Fan {'açma' if fan_status else 'kapama'} komutu gönderildi",
            'fan_status': fan_status
        })
    else:
        return Response({
            'success': False,
            'message': 'MQTT komutu gönderilemedi'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SensorReadingViewSet(viewsets.ModelViewSet):
    serializer_class = SensorReadingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SensorReading.objects.filter(room__user=self.request.user)
    
    def perform_create(self, serializer):
        room = serializer.validated_data.get('room')
        # Bu oda bu kullanıcıya ait mi kontrol et
        if room.user != self.request.user:
            raise serializers.ValidationError("You don't have permission to add readings to this room")
        serializer.save()

class DeviceStatusViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceStatusSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DeviceStatus.objects.filter(room__user=self.request.user)
    
    def perform_create(self, serializer):
        room = serializer.validated_data.get('room')
        # Bu oda bu kullanıcıya ait mi kontrol et
        if room.user != self.request.user:
            raise serializers.ValidationError("You don't have permission to update device status for this room")
        serializer.save()