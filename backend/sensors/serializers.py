from rest_framework import serializers
from .models import Room, SensorReading, DeviceStatus

class RoomSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Room
        fields = ['id', 'name', 'created_at', 'user_username']
        read_only_fields = ['created_at', 'user_username']

class SensorReadingSerializer(serializers.ModelSerializer):
    room_name = serializers.ReadOnlyField(source='room.name')
    
    class Meta:
        model = SensorReading
        fields = ['id', 'room', 'room_name', 'temperature', 'humidity', 'presence', 'timestamp']
        read_only_fields = ['timestamp', 'room_name']
        
    def validate_room(self, room):
        # Kullanıcının, veri eklemek istediği odaya erişimi var mı kontrol et
        request = self.context.get('request')
        if request and room.user != request.user:
            raise serializers.ValidationError("Bu odaya sensör verisi ekleme yetkiniz yok")
        return room

class DeviceStatusSerializer(serializers.ModelSerializer):
    room_name = serializers.ReadOnlyField(source='room.name')
    
    class Meta:
        model = DeviceStatus
        fields = ['id', 'room', 'room_name', 'valve_status', 'fan_status', 
                 'battery_level', 'connection_status', 'last_updated']
        read_only_fields = ['last_updated', 'room_name']
        
    def validate_room(self, room):
        # Kullanıcının, durumunu güncellemek istediği odaya erişimi var mı kontrol et
        request = self.context.get('request')
        if request and room.user != request.user:
            raise serializers.ValidationError("Bu odanın cihaz durumunu güncelleme yetkiniz yok")
        return room