from rest_framework import serializers
from .models import Room, SensorReading, DeviceStatus

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['created_at']

class SensorReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorReading
        fields = ['id', 'room', 'temperature', 'humidity', 'presence', 'timestamp']
        read_only_fields = ['timestamp']

class DeviceStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceStatus
        fields = ['id', 'room', 'valve_status', 'fan_status', 'battery_level', 'connection_status', 'last_updated']
        read_only_fields = ['last_updated']