"""
Serializers for Core models
"""
from rest_framework import serializers
from .models import ConsularOffice, ServiceType, Announcement, FAQ, AuditLog, SiteSettings


class ConsularOfficeSerializer(serializers.ModelSerializer):
    """Consular Office serializer"""
    full_address = serializers.ReadOnlyField()
    
    class Meta:
        model = ConsularOffice
        fields = [
            'id', 'name', 'office_type', 'full_address',
            'address_line1', 'address_line2', 'city', 'postal_code', 'country',
            'latitude', 'longitude',
            'phone_primary', 'phone_secondary', 'email', 'emergency_phone',
            'opening_hours', 'jurisdiction_countries',
            'is_active', 'accepts_appointments'
        ]


class ServiceTypeSerializer(serializers.ModelSerializer):
    """Service Type serializer"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    offices = ConsularOfficeSerializer(many=True, read_only=True)
    
    class Meta:
        model = ServiceType
        fields = [
            'id', 'name', 'category', 'category_display', 'description',
            'required_documents', 'base_fee', 'processing_time_days',
            'offices', 'is_active', 'requires_appointment', 'display_order'
        ]


class ServiceTypeCreateUpdateSerializer(serializers.ModelSerializer):
    """Service Type serializer for creation and updates"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    offices = serializers.PrimaryKeyRelatedField(
        queryset=ConsularOffice.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = ServiceType
        fields = [
            'id', 'name', 'category', 'category_display', 'description',
            'required_documents', 'base_fee', 'processing_time_days',
            'offices', 'is_active', 'requires_appointment', 'display_order'
        ]
    
    def create(self, validated_data):
        offices_data = validated_data.pop('offices', [])
        service = ServiceType.objects.create(**validated_data)
        service.offices.set(offices_data)
        return service
    
    def update(self, instance, validated_data):
        offices_data = validated_data.pop('offices', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.offices.set(offices_data)
        return instance


class ServiceTypeListSerializer(serializers.ModelSerializer):
    """Simplified Service Type serializer for lists"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = ServiceType
        fields = [
            'id', 'name', 'category', 'category_display', 
            'base_fee', 'processing_time_days', 'requires_appointment'
        ]


class AnnouncementSerializer(serializers.ModelSerializer):
    """Announcement serializer"""
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'priority', 'priority_display',
            'office', 'office_name', 'is_pinned', 'is_published',
            'publish_from', 'publish_to', 'target_all_users', 'target_roles',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class FAQSerializer(serializers.ModelSerializer):
    """FAQ serializer"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = FAQ
        fields = ['id', 'category', 'category_display', 'question', 'answer', 'display_order']


class AuditLogSerializer(serializers.ModelSerializer):
    """Audit Log serializer"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'user_name', 'action', 'action_display',
            'description', 'ip_address', 'user_agent', 'timestamp', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        return "Utilisateur anonyme"


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Site Settings serializer - Admin only"""
    updated_by_email = serializers.CharField(source='updated_by.email', read_only=True)
    
    class Meta:
        model = SiteSettings
        fields = [
            'id', 'registration_enabled', 'registration_message',
            'appointments_enabled', 'appointments_message',
            'applications_enabled', 'applications_message',
            'payments_enabled', 'payments_message',
            'site_maintenance_mode', 'maintenance_message',
            'updated_at', 'updated_by', 'updated_by_email'
        ]
        read_only_fields = ['id', 'updated_at', 'updated_by', 'updated_by_email']

