from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Room, SensorReading, DeviceStatus
from .serializers import RoomSerializer, SensorReadingSerializer, DeviceStatusSerializer

# MQTT istemcisini import et (dosyanızda olduğunu varsayıyorum)
from .mqtt_client import mqtt_client

class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Sadece kullanıcının kendi odalarını getir
        return Room.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Oda oluştururken mevcut kullanıcıyı ata
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def current_status(self, request, pk=None):
        """Bir odanın güncel durumunu döndürür"""
        room = self.get_object()
        
        # En son sensor okumalarını al
        latest_reading = SensorReading.objects.filter(
            room=room
        ).order_by('-timestamp').first()
        
        # Cihaz durumunu al
        device_status = DeviceStatus.objects.filter(room=room).first()
        
        return Response({
            'room_id': room.id,
            'room_name': room.name,
            'temperature': latest_reading.temperature if latest_reading else None,
            'humidity': latest_reading.humidity if latest_reading else None,
            'presence': latest_reading.presence if latest_reading else False,
            'valve_status': device_status.valve_status if device_status else False,
            'fan_status': device_status.fan_status if device_status else False,
            'battery_level': device_status.battery_level if device_status else 0,
            'connection_status': device_status.connection_status if device_status else 'unknown',
            'last_reading_time': latest_reading.timestamp if latest_reading else None,
            'last_device_update': device_status.last_updated if device_status else None,
        })
    
    @action(detail=True, methods=['get'])
    def sensor_history(self, request, pk=None):
        """Bir odanın sensör verilerinin geçmişini döndürür"""
        room = self.get_object()
        
        # İsteğe bağlı tarih filtreleme parametreleri
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Varsayılan olarak son 24 saat
        if not start_date:
            start_date = timezone.now() - timezone.timedelta(days=1)
        
        # Veritabanı sorgusu
        readings = SensorReading.objects.filter(
            room=room,
            timestamp__gte=start_date
        )
        
        if end_date:
            readings = readings.filter(timestamp__lte=end_date)
        
        serializer = SensorReadingSerializer(readings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def control_valve(self, request, pk=None):
        """Valf kontrolü için MQTT komutu gönderir"""
        room = self.get_object()
        valve_status = request.data.get('valve_status', False)
        
        # Veri tabanında güncelle
        device_status, created = DeviceStatus.objects.get_or_create(room=room)
        device_status.valve_status = valve_status
        device_status.save()
        
        # MQTT üzerinden komutu gönder
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

    @action(detail=True, methods=['post'])
    def control_fan(self, request, pk=None):
        """Fan kontrolü için MQTT komutu gönderir"""
        room = self.get_object()
        fan_status = request.data.get('fan_status', False)
        
        # Veri tabanında güncelle
        device_status, created = DeviceStatus.objects.get_or_create(room=room)
        device_status.fan_status = fan_status
        device_status.save()
        
        # MQTT üzerinden komutu gönder
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
        

    @action(detail=True, methods=['get'])
    def room_details(self, request, pk=None):
        """
        Bir odaya ait tüm detaylı bilgileri döndürür:
        - Oda bilgileri
        - En son sensör verileri (sıcaklık, nem, varlık)
        - Cihaz durumu (valf/ısıtma, fan, pil seviyesi, bağlantı)
        - Son 5 sensör okuması
        - İstatistikler
        """
        room = self.get_object()
        
        # Oda temel bilgileri
        room_data = RoomSerializer(room).data
        
        # En son sensör okumaları
        latest_reading = SensorReading.objects.filter(room=room).first()
        
        # Son 5 okuma (en yenileri)
        recent_readings = SensorReading.objects.filter(room=room)[:5]
        recent_readings_data = SensorReadingSerializer(recent_readings, many=True).data
        
        # Cihaz durumu
        device_status = DeviceStatus.objects.filter(room=room).first()
        device_data = DeviceStatusSerializer(device_status).data if device_status else None
        
        # Sensör istatistikleri
        from django.db.models import Avg, Min, Max
        from django.utils import timezone
        from datetime import timedelta
        
        # Son 24 saatteki veriler
        one_day_ago = timezone.now() - timedelta(days=1)
        stats = SensorReading.objects.filter(
            room=room,
            timestamp__gte=one_day_ago
        ).aggregate(
            avg_temp=Avg('temperature'),
            min_temp=Min('temperature'),
            max_temp=Max('temperature'),
            avg_humidity=Avg('humidity'),
            min_humidity=Min('humidity'),
            max_humidity=Max('humidity')
        )
        
        # Tüm verileri birleştir
        response_data = {
            'room': room_data,
            'current_sensor_data': {
                'temperature': latest_reading.temperature if latest_reading else None,
                'humidity': latest_reading.humidity if latest_reading else None,
                'presence': latest_reading.presence if latest_reading else False,
                'timestamp': latest_reading.timestamp if latest_reading else None,
            },
            'device_status': {
                'valve_status': device_status.valve_status if device_status else False,
                'fan_status': device_status.fan_status if device_status else False,
                'battery_level': device_status.battery_level if device_status else 0,
                'connection_status': device_status.connection_status if device_status else 'unknown',
                'last_updated': device_status.last_updated if device_status else None,
            },
            'recent_readings': recent_readings_data,
            'statistics': {
                'average_temperature': round(stats['avg_temp'], 1) if stats['avg_temp'] is not None else None,
                'min_temperature': stats['min_temp'],
                'max_temperature': stats['max_temp'],
                'average_humidity': round(stats['avg_humidity'], 1) if stats['avg_humidity'] is not None else None,
                'min_humidity': stats['min_humidity'],
                'max_humidity': stats['max_humidity'],
            }
        }
        
        return Response(response_data)

class SensorReadingViewSet(viewsets.ModelViewSet):
    serializer_class = SensorReadingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # İsteğe bağlı oda filtreleme parametresi
        room_id = self.request.query_params.get('room')
        
        queryset = SensorReading.objects.filter(room__user=self.request.user)
        
        if room_id:
            queryset = queryset.filter(room_id=room_id)
            
        # İsteğe bağlı tarih filtreleme parametreleri
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
            
        return queryset
    
    def perform_create(self, serializer):
        room = serializer.validated_data.get('room')
        # Bu oda bu kullanıcıya ait mi kontrol et
        if room.user != self.request.user:
            raise serializers.ValidationError("Bu odaya sensör verisi ekleme yetkiniz yok")
        serializer.save()


class DeviceStatusViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceStatusSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # İsteğe bağlı oda filtreleme parametresi
        room_id = self.request.query_params.get('room')
        
        queryset = DeviceStatus.objects.filter(room__user=self.request.user)
        
        if room_id:
            queryset = queryset.filter(room_id=room_id)
            
        return queryset
    
    def perform_create(self, serializer):
        room = serializer.validated_data.get('room')
        # Bu oda bu kullanıcıya ait mi kontrol et
        if room.user != self.request.user:
            raise serializers.ValidationError("Bu odanın cihaz durumunu güncelleme yetkiniz yok")
        serializer.save()