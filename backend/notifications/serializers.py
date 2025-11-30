"""
Serializers for Notification models
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'channel', 'channel_display',
            'status', 'status_display', 'notification_type',
            'related_object_type', 'related_object_id',
            'created_at', 'sent_at', 'read_at', 'is_read'
        ]
        read_only_fields = ['id', 'created_at', 'sent_at', 'read_at']
    
    def get_is_read(self, obj):
        """Check if notification is read"""
        return obj.status == Notification.Status.READ


class NotificationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for notification list"""
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'channel', 'channel_display',
            'status', 'notification_type', 'created_at', 'is_read'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_is_read(self, obj):
        """Check if notification is read"""
        return obj.status == Notification.Status.READ

