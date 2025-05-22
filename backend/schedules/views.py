from rest_framework import viewsets, permissions, status 
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser,AllowAny
from django.db import transaction

from .models import Schedule, Day, Hour, ScheduleTime, RoomSchedule
from .serializers import (
    ScheduleSerializer, DaySerializer, HourSerializer, ScheduleTimeSerializer,
    RoomScheduleSerializer, DetailedScheduleSerializer
)

from .decision_engine import decision_engine


class DayViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Günleri listelemek için ViewSet
    """
    queryset = Day.objects.all()
    serializer_class = DaySerializer
    permission_classes = [permissions.IsAuthenticated]


class HourViewSet(viewsets.ModelViewSet):
    """
    Saat dilimlerini yönetmek için ViewSet
    """
    queryset = Hour.objects.all()
    serializer_class = HourSerializer
    permission_classes = [permissions.IsAuthenticated]




class ScheduleViewSet(viewsets.ModelViewSet):
    """
    Programları yönetmek için ViewSet
    """
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'detailed':
            return DetailedScheduleSerializer
        return ScheduleSerializer
    
    @action(detail=True, methods=['get'])
    def detailed(self, request, pk=None):
        """
        Programın detaylı görüntüsünü günlere göre gruplanmış zaman dilimleriyle al
        """
        schedule = self.get_object()
        serializer = self.get_serializer(schedule)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign_to_room(self, request, pk=None):
        """
        Bir programı bir odaya ata 
        - Odaya önceden atanmış program varsa, o program kaldırılır
        """
        schedule = self.get_object()
        room_id = request.data.get('room_id')
        
        if not room_id:
            return Response({"error": "Room ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Önce odaya ait eski programları temizle
            RoomSchedule.objects.filter(room_id=room_id).delete()
            
            # Yeni program atamasını oluştur
            room_schedule = RoomSchedule.objects.create(
                room_id_id=room_id,
                schedule_id=schedule,
                is_active=True
            )
            
            serializer = RoomScheduleSerializer(room_schedule)
            return Response(serializer.data)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def update_time_slots(self, request, pk=None):
        """
        Bir program için zaman dilimlerini güncelle veya oluştur
        
        Beklenen format:
        {
            "time_slots": [
                {
                    "day_id": 1,
                    "hour_id": 1,
                    "temperature": 24.5,
                    "is_heating_active": true,
                    "is_fan_active": false
                },
                ...
            ]
        }
        """
        schedule = self.get_object()
        time_slots_data = request.data.get('time_slots', [])
        
        if not time_slots_data:
            return Response({"error": "No time slots provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        created_time_slots = []
        
        try:
            # Bu program için mevcut zaman dilimlerini temizle
            ScheduleTime.objects.filter(schedule_id=schedule).delete()
            
            for slot_data in time_slots_data:
                # Schedule Time oluştur
                schedule_time = ScheduleTime.objects.create(
                    day_id_id=slot_data['day_id'],
                    hour_id_id=slot_data['hour_id'],
                    schedule_id=schedule,
                    desired_temperature=slot_data.get('temperature', 24.0),
                    is_heating_active=slot_data.get('is_heating_active', True),
                    is_fan_active=slot_data.get('is_fan_active', False)
                )
                
                created_time_slots.append(schedule_time)
            
            serializer = ScheduleTimeSerializer(created_time_slots, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'post'], permission_classes=[IsAdminUser])
    def decision_engine_status(self, request):
        if request.method == 'GET':
            # Mevcut durumu döndür
            return Response({
                'running': decision_engine.running,
                'check_interval': decision_engine.check_interval,
                'temperature_threshold': decision_engine.temperature_threshold
            })
        elif request.method == 'POST':
            # Durumu değiştir
            action = request.data.get('action')
            if action == 'start':
                decision_engine.start()
                return Response({'status': 'Decision Engine başlatıldı'})
            elif action == 'stop':
                decision_engine.stop()
                return Response({'status': 'Decision Engine durduruldu'})
            elif action == 'update_settings':
                # Ayarları güncelle
                check_interval = request.data.get('check_interval')
                temperature_threshold = request.data.get('temperature_threshold')
                
                if check_interval is not None:
                    decision_engine.check_interval = int(check_interval)
                
                if temperature_threshold is not None:
                    decision_engine.temperature_threshold = float(temperature_threshold)
                
                return Response({
                    'status': 'Ayarlar güncellendi',
                    'check_interval': decision_engine.check_interval,
                    'temperature_threshold': decision_engine.temperature_threshold
                })
            else:
                return Response({'error': 'Geçersiz eylem'}, status=status.HTTP_400_BAD_REQUEST)

class ScheduleTimeViewSet(viewsets.ModelViewSet):
    """
    Program-zaman ayarlarını yönetmek için ViewSet
    """
    queryset = ScheduleTime.objects.all()
    serializer_class = ScheduleTimeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_schedule(self, request):
        """
        Program ID'sine göre program-zaman ayarlarını getir
        """
        schedule_id = request.query_params.get('schedule_id')
        if not schedule_id:
            return Response({"error": "Schedule ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        schedule_times = ScheduleTime.objects.filter(schedule_id=schedule_id)
        serializer = self.get_serializer(schedule_times, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_day(self, request):
        """
        Gün ID'sine göre program-zaman ayarlarını getir
        """
        day_id = request.query_params.get('day_id')
        schedule_id = request.query_params.get('schedule_id')
        
        if not day_id:
            return Response({"error": "Day ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        queryset = ScheduleTime.objects.filter(day_id=day_id)
        
        if schedule_id:
            queryset = queryset.filter(schedule_id=schedule_id)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class RoomScheduleViewSet(viewsets.ModelViewSet):
    """
    Oda-program atamalarını yönetmek için ViewSet
    """
    queryset = RoomSchedule.objects.all()
    serializer_class = RoomScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """
        Yeni bir oda-program ilişkisi oluştur 
        - Bir odaya yeni bir program atandığında, o odanın eski programı otomatik olarak kaldırılır
        """
        room_id = request.data.get('room_id')
        schedule_id = request.data.get('schedule_id')
        
        if not room_id or not schedule_id:
            return Response({"error": "Room ID and Schedule ID are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Önce odaya ait eski programları temizle
            RoomSchedule.objects.filter(room_id=room_id).delete()
            
            # Yeni program atamasını oluştur
            room_schedule = RoomSchedule.objects.create(
                room_id_id=room_id,
                schedule_id_id=schedule_id,
                is_active=True
            )
            
            serializer = self.get_serializer(room_schedule)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """
        Bir oda-program ilişkisini güncelle
        - Aktif değişikliği yapmak istediğimizde bu kullanılır
        """
        instance = self.get_object()
        
        # is_active değeri değiştirilmek isteniyorsa
        if 'is_active' in request.data and request.data['is_active']:
            # Diğer program ilişkilerini temizle
            RoomSchedule.objects.filter(room_id=instance.room_id).exclude(pk=instance.pk).delete()
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_room(self, request):
        """
        Oda ID'sine göre programı getir
        - Bir oda için sadece bir aktif program olacak
        """
        room_id = request.query_params.get('room_id')
        if not room_id:
            return Response({"error": "Room ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Odanın aktif programını buluyoruz
            room_schedule = RoomSchedule.objects.get(room_id=room_id)
            serializer = self.get_serializer(room_schedule)
            return Response(serializer.data)
        except RoomSchedule.DoesNotExist:
            return Response({"message": "No schedule assigned to this room"}, status=status.HTTP_404_NOT_FOUND)
        
