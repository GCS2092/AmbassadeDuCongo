"""
Serializers for Appointment models
"""
from rest_framework import serializers
from django.utils import timezone
from .models import Appointment, AppointmentSlot
from core.serializers import ConsularOfficeSerializer, ServiceTypeListSerializer


class AppointmentSerializer(serializers.ModelSerializer):
    """Appointment serializer"""
    office_name = serializers.CharField(source='office.name', read_only=True)
    service_name = serializers.CharField(source='service_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'reference_number', 'user', 'user_name',
            'office', 'office_name', 'service_type', 'service_name',
            'appointment_date', 'appointment_time', 'duration_minutes',
            'status', 'status_display', 'qr_code', 'qr_code_url',
            'user_notes', 'admin_notes', 'assigned_agent',
            'confirmation_sent', 'reminder_sent',
            'created_at', 'confirmed_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'reference_number', 'qr_code', 'assigned_agent',
            'admin_notes', 'confirmation_sent', 'reminder_sent',
            'created_at', 'confirmed_at', 'completed_at'
        ]
    
    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
        return None
    
    def validate_appointment_date(self, value):
        """Ensure appointment date is in the future"""
        if value < timezone.now().date():
            raise serializers.ValidationError("La date du rendez-vous doit être dans le futur.")
        return value
    
    def validate(self, attrs):
        """Validate appointment availability"""
        office = attrs.get('office')
        service_type = attrs.get('service_type')
        appointment_date = attrs.get('appointment_date')
        appointment_time = attrs.get('appointment_time')
        
        # Check if office accepts appointments
        if not office.accepts_appointments:
            raise serializers.ValidationError("Ce bureau n'accepte pas les rendez-vous en ligne.")
        
        # Check if service requires appointment
        if not service_type.requires_appointment:
            raise serializers.ValidationError("Ce service ne nécessite pas de rendez-vous.")
        
        # Check for existing appointment at same time
        existing = Appointment.objects.filter(
            office=office,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            status__in=['PENDING', 'CONFIRMED']
        ).exclude(id=self.instance.id if self.instance else None)
        
        if existing.exists():
            raise serializers.ValidationError("Ce créneau n'est plus disponible.")
        
        return attrs


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating appointments"""
    
    class Meta:
        model = Appointment
        fields = [
            'office', 'service_type', 'appointment_date', 
            'appointment_time', 'duration_minutes', 'user_notes'
        ]
    
    def validate(self, attrs):
        """Validate appointment data"""
        # Run parent validation
        serializer = AppointmentSerializer()
        return serializer.validate(attrs)
    
    def create(self, validated_data):
        # Set user from request context
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AppointmentSlotSerializer(serializers.ModelSerializer):
    """Appointment slot serializer"""
    office_name = serializers.CharField(source='office.name', read_only=True)
    service_name = serializers.CharField(source='service_type.name', read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    appointments_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = AppointmentSlot
        fields = [
            'id', 'office', 'office_name', 'service_type', 'service_name',
            'date', 'start_time', 'end_time', 'max_appointments',
            'is_available', 'is_full', 'appointments_count'
        ]

