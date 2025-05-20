from rest_framework import serializers
from .models import Schedule, Day, Hour, ScheduleTime, RoomSchedule

class DaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Day
        fields = '__all__'


class HourSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hour
        fields = '__all__'


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = '__all__'


class ScheduleTimeSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='day_id.day', read_only=True)
    hour_range = serializers.CharField(source='hour_id.__str__', read_only=True)
    schedule_name = serializers.CharField(source='schedule_id.name', read_only=True)
    
    class Meta:
        model = ScheduleTime
        fields = ['id', 'day_id', 'hour_id', 'schedule_id', 'day_name', 'hour_range', 
                 'schedule_name', 'desired_temperature', 'is_heating_active', 'is_fan_active']


class RoomScheduleSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room_id.name', read_only=True) 
    schedule_name = serializers.CharField(source='schedule_id.name', read_only=True)
    
    class Meta:
        model = RoomSchedule
        fields = ['id', 'room_id', 'schedule_id', 'room_name', 'schedule_name', 'is_active']


class DetailedScheduleSerializer(serializers.ModelSerializer):
    schedule_times = serializers.SerializerMethodField()
    room_assignments = serializers.SerializerMethodField()
    
    class Meta:
        model = Schedule
        fields = ['id', 'name', 'description', 'schedule_times', 'room_assignments']
    
    def get_schedule_times(self, obj):
        # Günlere göre gruplandırılmış zaman ve sıcaklık bilgileri
        schedule_times = obj.schedule_times.all().select_related('day_id', 'hour_id')
        result = {}
        
        for st in schedule_times:
            day_id = st.day_id.id
            if day_id not in result:
                result[day_id] = {
                    'day': st.day_id.day,
                    'hours': []
                }
            
            result[day_id]['hours'].append({
                'id': st.id,
                'hour_id': st.hour_id.id,
                'start_time': st.hour_id.start_time.strftime('%H:%M'),
                'end_time': st.hour_id.end_time.strftime('%H:%M'),
                'temperature': st.desired_temperature,
                'is_heating_active': st.is_heating_active,
                'is_fan_active': st.is_fan_active
            })
        
        return list(result.values())
    
    def get_room_assignments(self, obj):
        room_schedules = obj.room_schedules.all()
        return RoomScheduleSerializer(room_schedules, many=True).data