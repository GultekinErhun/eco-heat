from rest_framework import serializers
from .models import ScheduleType, ScheduleConfig, ScheduleDay, TimeSlot

class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['id', 'type', 'start_time', 'end_time', 'is_active']
        
class ScheduleDaySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_display', read_only=True)
    
    class Meta:
        model = ScheduleDay
        fields = ['id', 'day', 'day_name']

class ScheduleConfigSerializer(serializers.ModelSerializer):
    days = ScheduleDaySerializer(many=True, read_only=True)
    time_slots = TimeSlotSerializer(many=True, read_only=True)
    room_name = serializers.ReadOnlyField(source='room.name')
    days_mode_display = serializers.CharField(source='get_days_mode_display', read_only=True)
    
    class Meta:
        model = ScheduleConfig
        fields = ['id', 'schedule_type', 'room', 'room_name', 'days_mode', 'days_mode_display', 
                 'desired_temperature', 'presence_based', 'is_active', 
                 'days', 'time_slots', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_room(self, room):
        # Kullanıcının, programlamak istediği odaya erişimi var mı kontrol et
        request = self.context.get('request')
        if request and room.user != request.user:
            raise serializers.ValidationError("Bu odayı programlama yetkiniz yok")
        return room

class ScheduleTypeSerializer(serializers.ModelSerializer):
    configs = ScheduleConfigSerializer(many=True, read_only=True)
    user_username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = ScheduleType
        fields = ['id', 'name', 'description', 'user_username', 'created_at', 'configs']
        read_only_fields = ['created_at', 'user_username']

# İç içe kayıt yapmak için kullanılacak özel serializerlar
class TimeSlotCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['type', 'start_time', 'end_time', 'is_active']

class ScheduleDayCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleDay
        fields = ['day']

class ScheduleConfigCreateSerializer(serializers.ModelSerializer):
    days = ScheduleDayCreateSerializer(many=True, required=False)
    time_slots = TimeSlotCreateSerializer(many=True, required=False)
    
    class Meta:
        model = ScheduleConfig
        fields = ['room', 'days_mode', 'desired_temperature', 'presence_based', 
                 'is_active', 'days', 'time_slots']
    
    def create(self, validated_data):
        days_data = validated_data.pop('days', [])
        time_slots_data = validated_data.pop('time_slots', [])
        
        schedule_config = ScheduleConfig.objects.create(**validated_data)
        
        # Özel günleri oluştur
        for day_data in days_data:
            ScheduleDay.objects.create(schedule_config=schedule_config, **day_data)
        
        # Zaman dilimlerini oluştur
        for slot_data in time_slots_data:
            TimeSlot.objects.create(schedule_config=schedule_config, **slot_data)
            
        return schedule_config