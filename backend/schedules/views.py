from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from .models import ScheduleType, ScheduleConfig, ScheduleDay, TimeSlot
from .serializers import (ScheduleTypeSerializer, ScheduleConfigSerializer, 
                         ScheduleDaySerializer, TimeSlotSerializer,
                         ScheduleConfigCreateSerializer)

from sensors.mqtt_client import mqtt_client

class ScheduleTypeViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Sadece kullanıcının kendi program tiplerini getir
        return ScheduleType.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Program tipi oluştururken mevcut kullanıcıyı ata
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_config(self, request, pk=None):
        """Belirli bir program tipine yeni konfigürasyon ekler"""
        schedule_type = self.get_object()
        serializer = ScheduleConfigCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Konfigürasyonu oluştur
                    config = serializer.save(schedule_type=schedule_type)
                    
                    # Başarılı yanıt döndür
                    return Response({
                        'success': True,
                        'message': 'Program konfigürasyonu başarıyla eklendi',
                        'config': ScheduleConfigSerializer(config).data
                    }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'success': False,
                    'message': f'Program konfigürasyonu eklenirken hata oluştu: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def apply_schedule(self, request, pk=None):
        """Belirli bir program tipini tüm odalara uygular"""
        schedule_type = self.get_object()
        room_id = request.data.get('room_id')  # Opsiyonel, belirli bir odaya uygulamak için
        
        try:
            # İlgili konfigürasyonları bul
            configs = ScheduleConfig.objects.filter(schedule_type=schedule_type)
            
            if room_id:
                configs = configs.filter(room_id=room_id)
            
            if not configs.exists():
                return Response({
                    'success': False,
                    'message': 'Bu program tipi için konfigürasyon bulunamadı'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Her konfigürasyon için gerekli MQTT komutlarını gönder
            for config in configs:
                # Isıtma için valf kontrolü
                heating_slots = TimeSlot.objects.filter(
                    schedule_config=config, 
                    type='heating', 
                    is_active=True
                )
                
                current_time = timezone.localtime(timezone.now()).time()
                heating_active = False
                
                # Şu anki saate göre ısıtma aktif mi kontrol et
                for slot in heating_slots:
                    if slot.start_time <= current_time <= slot.end_time:
                        heating_active = True
                        break
                
                # Valfi aç/kapa
                mqtt_client.publish_valve_command(config.room.id, heating_active)
                
                # Fan kontrolü
                fan_slots = TimeSlot.objects.filter(
                    schedule_config=config, 
                    type='fan', 
                    is_active=True
                )
                
                fan_active = False
                
                # Şu anki saate göre fan aktif mi kontrol et
                for slot in fan_slots:
                    if slot.start_time <= current_time <= slot.end_time:
                        fan_active = True
                        break
                
                # Fanı aç/kapa
                mqtt_client.publish_fan_command(config.room.id, fan_active)
            
            return Response({
                'success': True,
                'message': 'Program başarıyla uygulandı',
                'affected_rooms': [config.room.name for config in configs]
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Program uygulanırken hata oluştu: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ScheduleConfigViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleConfigSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Sadece kullanıcının kendi konfigürasyonlarını getir
        return ScheduleConfig.objects.filter(schedule_type__user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ScheduleConfigCreateSerializer
        return ScheduleConfigSerializer
    
    @action(detail=True, methods=['post'])
    def add_time_slot(self, request, pk=None):
        """Bir konfigürasyona yeni zaman dilimi ekler"""
        config = self.get_object()
        serializer = TimeSlotSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(schedule_config=config)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_day(self, request, pk=None):
        """Bir konfigürasyona özel gün ekler"""
        config = self.get_object()
        serializer = ScheduleDaySerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(schedule_config=config)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TimeSlotViewSet(viewsets.ModelViewSet):
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Sadece kullanıcının kendi zaman dilimlerini getir
        return TimeSlot.objects.filter(schedule_config__schedule_type__user=self.request.user)

class ScheduleDayViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleDaySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Sadece kullanıcının kendi özel günlerini getir
        return ScheduleDay.objects.filter(schedule_config__schedule_type__user=self.request.user)