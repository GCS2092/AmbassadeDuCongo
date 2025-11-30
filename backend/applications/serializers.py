"""
Serializers for Application models
"""
from rest_framework import serializers
from .models import Document, Application, VisaApplication, PassportApplication
from core.serializers import ServiceTypeListSerializer


class DocumentSerializer(serializers.ModelSerializer):
    """Document serializer"""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'document_type', 'document_type_display', 'file', 'file_url',
            'original_filename', 'file_size', 'description',
            'is_verified', 'verified_at', 'verification_notes',
            'created_at'
        ]
        read_only_fields = [
            'id', 'original_filename', 'file_size', 
            'is_verified', 'verified_at', 'verification_notes', 'created_at'
        ]
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
    
    def validate_file(self, value):
        """Validate file size and type"""
        from django.conf import settings
        
        # Check file size
        max_size = settings.MAX_UPLOAD_SIZE
        if value.size > max_size:
            raise serializers.ValidationError(
                f"La taille du fichier ne doit pas dépasser {max_size / (1024*1024):.1f} MB."
            )
        
        # Check file extension
        allowed_types = settings.ALLOWED_DOCUMENT_TYPES
        ext = value.name.split('.')[-1].lower()
        if ext not in allowed_types:
            raise serializers.ValidationError(
                f"Type de fichier non autorisé. Types acceptés: {', '.join(allowed_types)}"
            )
        
        return value


class VisaApplicationSerializer(serializers.ModelSerializer):
    """Visa application details serializer"""
    visa_type_display = serializers.CharField(source='get_visa_type_display', read_only=True)
    
    class Meta:
        model = VisaApplication
        fields = [
            'visa_type', 'visa_type_display', 'purpose_of_visit',
            'intended_entry_date', 'intended_departure_date', 'duration_days',
            'destination_city', 'accommodation_address',
            'sponsor_name', 'sponsor_phone', 'sponsor_address',
            'occupation', 'employer'
        ]
    
    def validate(self, attrs):
        """Validate visa application data"""
        # Check required fields
        required_fields = ['visa_type', 'purpose_of_visit', 'intended_entry_date', 
                          'intended_departure_date', 'duration_days', 'destination_city']
        
        for field in required_fields:
            if not attrs.get(field):
                raise serializers.ValidationError({
                    field: f"Le champ {field} est requis."
                })
        
        # Validate dates
        entry_date = attrs.get('intended_entry_date')
        departure_date = attrs.get('intended_departure_date')
        
        if entry_date and departure_date and entry_date >= departure_date:
            raise serializers.ValidationError({
                'intended_departure_date': "La date de sortie doit être postérieure à la date d'entrée."
            })
        
        # Validate duration
        duration = attrs.get('duration_days')
        if duration and duration <= 0:
            raise serializers.ValidationError({
                'duration_days': "La durée doit être positive."
            })
        
        return attrs


class PassportApplicationSerializer(serializers.ModelSerializer):
    """Passport application details serializer"""
    passport_type_display = serializers.CharField(source='get_passport_type_display', read_only=True)
    
    class Meta:
        model = PassportApplication
        fields = [
            'passport_type', 'passport_type_display',
            'current_passport_number', 'current_passport_issue_date',
            'current_passport_expiry_date', 'replacement_reason'
        ]
    
    def validate(self, attrs):
        """Validate passport application data"""
        passport_type = attrs.get('passport_type')
        
        # For renewals, require current passport info
        if passport_type == 'RENEWAL':
            if not attrs.get('current_passport_number'):
                raise serializers.ValidationError({
                    'current_passport_number': "Le numéro du passeport actuel est requis pour un renouvellement."
                })
        
        return attrs


class ApplicationSerializer(serializers.ModelSerializer):
    """Application serializer"""
    application_type_display = serializers.CharField(source='get_application_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    applicant_name = serializers.CharField(source='applicant.get_full_name', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    service_name = serializers.CharField(source='service_type.name', read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    visa_details = VisaApplicationSerializer(read_only=True)
    passport_details = PassportApplicationSerializer(read_only=True)
    is_paid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'reference_number', 'application_type', 'application_type_display',
            'service_type', 'service_name', 'applicant', 'applicant_name',
            'office', 'office_name', 'status', 'status_display',
            'documents', 'visa_details', 'passport_details',
            'base_fee', 'additional_fees', 'total_fee', 'is_paid',
            'applicant_notes', 'admin_notes', 'rejection_reason',
            'submitted_at', 'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'reference_number', 'total_fee', 'is_paid',
            'admin_notes', 'rejection_reason',
            'submitted_at', 'completed_at', 'created_at', 'updated_at'
        ]


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating applications"""
    visa_details = VisaApplicationSerializer(required=False)
    passport_details = PassportApplicationSerializer(required=False)
    document_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Application
        fields = [
            'application_type', 'service_type', 'office',
            'applicant_notes', 'visa_details', 'passport_details',
            'document_ids'
        ]
    
    def validate(self, attrs):
        """Validate application data"""
        application_type = attrs.get('application_type')
        
        # Require visa details for visa applications
        if application_type == 'VISA':
            if 'visa_details' not in attrs or not attrs['visa_details']:
                raise serializers.ValidationError({
                    "visa_details": "Les détails du visa sont requis pour une demande de visa."
                })
            
            # Validate visa details
            visa_serializer = VisaApplicationSerializer(data=attrs['visa_details'])
            if not visa_serializer.is_valid():
                raise serializers.ValidationError({
                    "visa_details": visa_serializer.errors
                })
        
        # Require passport details for passport applications
        if application_type in ['PASSPORT', 'PASSPORT_RENEWAL']:
            if 'passport_details' not in attrs or not attrs['passport_details']:
                raise serializers.ValidationError({
                    "passport_details": "Les détails du passeport sont requis."
                })
            
            # Validate passport details
            passport_serializer = PassportApplicationSerializer(data=attrs['passport_details'])
            if not passport_serializer.is_valid():
                raise serializers.ValidationError({
                    "passport_details": passport_serializer.errors
                })
        
        return attrs
    
    def create(self, validated_data):
        """Create application with related details"""
        visa_details_data = validated_data.pop('visa_details', None)
        passport_details_data = validated_data.pop('passport_details', None)
        document_ids = validated_data.pop('document_ids', [])
        
        # Set applicant from request
        validated_data['applicant'] = self.context['request'].user
        
        # Set base fee from service type
        validated_data['base_fee'] = validated_data['service_type'].base_fee
        
        # Create application
        application = Application.objects.create(**validated_data)
        
        # Add documents
        if document_ids:
            documents = Document.objects.filter(
                id__in=document_ids,
                owner=self.context['request'].user
            )
            application.documents.set(documents)
        
        # Create visa details if provided
        if visa_details_data:
            VisaApplication.objects.create(
                application=application,
                **visa_details_data
            )
        
        # Create passport details if provided
        if passport_details_data:
            PassportApplication.objects.create(
                application=application,
                **passport_details_data
            )
        
        return application

