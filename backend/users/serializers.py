"""
Serializers for User and Profile models
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from .models import User, Profile, UserDocument
from .validators import validate_strong_password
from .utils import hashids_encode


class ProfileSerializer(serializers.ModelSerializer):
    """Profile serializer - Carte d'identité numérique complète"""
    all_first_names = serializers.SerializerMethodField()
    all_last_names = serializers.SerializerMethodField()
    full_name_extended = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = [
            # Informations personnelles
            'date_of_birth', 'place_of_birth', 'gender', 'nationality',
            'photo',
            
            # Gestion de plusieurs noms et prénoms
            'additional_first_names', 'birth_last_name', 'used_last_name',
            'additional_last_names', 'all_first_names', 'all_last_names',
            'full_name_extended', 'display_name',
            
            # Documents officiels
            'consular_number', 'passport_number', 'passport_expiry',
            'id_card_number', 'id_card_expiry', 'birth_certificate_number',
            'driving_license_number', 'driving_license_expiry',
            
            # Informations professionnelles
            'profession', 'employer', 'work_phone',
            
            # Informations familiales
            'marital_status', 'spouse_name', 'children_count',
            
            # Adresse
            'address_line1', 'address_line2', 'city', 'postal_code', 'country',
            
            # Contact d'urgence
            'emergency_contact_name', 'emergency_contact_phone',
            
            # Métadonnées
            'documents_complete', 'is_profile_complete'
        ]
        read_only_fields = ['consular_number', 'is_profile_complete', 
                           'all_first_names', 'all_last_names', 
                           'full_name_extended', 'display_name']
    
    def get_all_first_names(self, obj):
        """Retourne tous les prénoms"""
        return obj.get_all_first_names() if obj else []
    
    def get_all_last_names(self, obj):
        """Retourne tous les noms de famille"""
        return obj.get_all_last_names() if obj else []
    
    def get_full_name_extended(self, obj):
        """Retourne le nom complet étendu"""
        return obj.get_full_name_extended() if obj else ''
    
    def get_display_name(self, obj):
        """Retourne le nom d'affichage"""
        return obj.get_display_name() if obj else ''


class UserSerializer(serializers.ModelSerializer):
    """User serializer with embedded profile"""
    profile = ProfileSerializer(read_only=True, required=False, allow_null=True)
    phone = serializers.CharField(source='phone_number', read_only=True)
    appointments_count = serializers.SerializerMethodField()
    applications_count = serializers.SerializerMethodField()
    hashed_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'hashed_id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'phone', 'consular_card_number', 'role', 
            'is_verified', 'is_2fa_enabled', 'is_active', 'is_staff', 'is_superuser',
            'profile', 'date_joined', 'last_login',
            'appointments_count', 'applications_count'
        ]
        read_only_fields = ['id', 'hashed_id', 'date_joined', 'last_login', 'appointments_count', 'applications_count']
    
    def get_hashed_id(self, obj):
        """Return hashed ID for secure URL generation"""
        return hashids_encode(obj.id)
    
    def get_appointments_count(self, obj):
        """Compter les rendez-vous de l'utilisateur"""
        try:
            from appointments.models import Appointment
            return Appointment.objects.filter(user=obj).count()
        except:
            return 0
    
    def get_applications_count(self, obj):
        """Compter les demandes de l'utilisateur"""
        try:
            from applications.models import Application
            return Application.objects.filter(applicant=obj).count()
        except:
            return 0


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin serializer for user management - allows modification of sensitive fields"""
    profile = ProfileSerializer(read_only=True, required=False, allow_null=True)
    phone = serializers.CharField(source='phone_number', read_only=True)
    appointments_count = serializers.SerializerMethodField()
    applications_count = serializers.SerializerMethodField()
    hashed_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'hashed_id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'phone', 'consular_card_number', 'role', 
            'is_verified', 'is_2fa_enabled', 'is_active', 'is_staff', 'is_superuser',
            'profile', 'date_joined', 'last_login',
            'appointments_count', 'applications_count'
        ]
        read_only_fields = ['id', 'hashed_id', 'date_joined', 'last_login', 'appointments_count', 'applications_count']
    
    def get_hashed_id(self, obj):
        """Return hashed ID for secure URL generation"""
        return hashids_encode(obj.id)
    
    def get_appointments_count(self, obj):
        """Compter les rendez-vous de l'utilisateur"""
        try:
            from appointments.models import Appointment
            return Appointment.objects.filter(user=obj).count()
        except:
            return 0
    
    def get_applications_count(self, obj):
        """Compter les demandes de l'utilisateur"""
        try:
            from applications.models import Application
            return Application.objects.filter(applicant=obj).count()
        except:
            return 0


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_strong_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    consular_card_number = serializers.CharField(required=False, allow_blank=True)
    # Support pour plusieurs prénoms et noms
    # Accepter soit une liste, soit une string (pour compatibilité avec le frontend)
    additional_first_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True,
        allow_null=True,
        help_text=_('Liste des prénoms supplémentaires (optionnel)')
    )
    birth_last_name = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=200,
        help_text=_('Nom de famille à la naissance (optionnel)')
    )
    used_last_name = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=200,
        help_text=_('Nom d\'usage (optionnel, si différent du nom de naissance)')
    )
    additional_last_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True,
        allow_null=True,
        help_text=_('Liste des noms de famille supplémentaires (optionnel)')
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 
                  'first_name', 'last_name', 'phone_number', 'consular_card_number',
                  'additional_first_names', 'birth_last_name', 'used_last_name', 'additional_last_names']
    
    def validate_consular_card_number(self, value):
        """Valider le format et l'existence du numéro de carte consulaire"""
        # Le numéro est optionnel - si fourni, on valide le format
        if not value or value.strip() == '':
            return None  # Permettre l'inscription sans numéro
        
        import re
        value_upper = value.upper().strip()
        if not re.match(r'^SN\d{7,9}$', value_upper):
            raise serializers.ValidationError(
                "Format invalide. Le numéro doit commencer par 'SN' suivi de 7 à 9 chiffres (ex: SN1234567). Si vous ne connaissez pas votre numéro, laissez ce champ vide et vous pourrez l'ajouter plus tard."
            )
        
        # Vérifier si le numéro existe déjà (pour éviter les doublons)
        if User.objects.filter(consular_card_number=value_upper).exists():
            raise serializers.ValidationError(
                "Ce numéro de carte consulaire est déjà utilisé. Si vous pensez qu'il s'agit d'une erreur, contactez l'ambassade."
            )
        
        # Note: On ne vérifie pas si le numéro existe dans une "base de données officielle" car
        # cette base n'existe pas encore. L'admin devra valider manuellement.
        # Le numéro sera vérifié lors de l'activation par l'admin.
        
        return value_upper

    def validate_phone_number(self, value):
        """Validate phone format and maximal length for registration"""
        if not value:
            return ''
        val = value.strip()
        # Quick length guard on the clear-text phone (prevent excessively long input)
        if len(val) > 30:
            raise serializers.ValidationError("Numéro de téléphone trop long (max 30 caractères).")
        import re
        if not re.match(r'^\+?1?\d{9,15}$', val):
            raise serializers.ValidationError("Format de numéro de téléphone invalide. Utilisez un format international, ex: +221771234567")
        return val

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        consular_card_number = validated_data.pop('consular_card_number', None)
        if consular_card_number:
            consular_card_number = consular_card_number.upper()
        
        # Extraire les données pour le profil (noms supplémentaires)
        # Gérer les cas où les champs peuvent être None, string vide, ou liste
        additional_first_names_raw = validated_data.pop('additional_first_names', None)
        if additional_first_names_raw is None:
            additional_first_names = []
        elif isinstance(additional_first_names_raw, str):
            # Si c'est une string (cas où le frontend envoie une string vide), convertir en liste vide
            additional_first_names = []
        elif isinstance(additional_first_names_raw, list):
            additional_first_names = [name.strip() for name in additional_first_names_raw if name and name.strip()]
        else:
            additional_first_names = []
        
        birth_last_name = validated_data.pop('birth_last_name', None) or ''
        used_last_name = validated_data.pop('used_last_name', None) or ''
        
        additional_last_names_raw = validated_data.pop('additional_last_names', None)
        if additional_last_names_raw is None:
            additional_last_names = []
        elif isinstance(additional_last_names_raw, str):
            additional_last_names = []
        elif isinstance(additional_last_names_raw, list):
            additional_last_names = [name.strip() for name in additional_last_names_raw if name and name.strip()]
        else:
            additional_last_names = []
        
        # Créer l'utilisateur comme inactif par défaut
        # Le compte restera inactif jusqu'à validation du numéro de carte par l'admin
        # Si pas de carte consulaire, le compte sera désactivé par le signal
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            consular_card_number=consular_card_number,  # Peut être None
            is_active=False,  # Inactif par défaut jusqu'à vérification
            is_verified=False  # Non vérifié jusqu'à validation par l'ambassade
        )
        
        # Mettre à jour le profil avec les noms supplémentaires
        # Le profil est créé automatiquement par le signal, on le rafraîchit et le met à jour
        user.refresh_from_db()  # Rafraîchir pour avoir le profil créé par le signal
        
        # Le profil devrait être créé par le signal, mais on vérifie quand même
        if hasattr(user, 'profile'):
            profile = user.profile
        else:
            # Si le profil n'existe pas encore (cas rare), le créer
            profile = Profile.objects.create(user=user)
        
        # Mettre à jour les champs de noms supplémentaires
        profile.additional_first_names = additional_first_names or []
        profile.birth_last_name = birth_last_name or ''
        profile.used_last_name = used_last_name or ''
        profile.additional_last_names = additional_last_names or []
        profile.save()
        
        return user


class PasswordChangeSerializer(serializers.Serializer):
    """Password change serializer"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Ancien mot de passe incorrect.")
        return value


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating profile - Tous les identifiants"""
    
    class Meta:
        model = Profile
        fields = [
            # Informations personnelles
            'date_of_birth', 'place_of_birth', 'gender', 'nationality', 'photo',
            
            # Gestion de plusieurs noms et prénoms
            'additional_first_names', 'birth_last_name', 'used_last_name',
            'additional_last_names',
            
            # Documents officiels
            'consular_number', 'passport_number', 'passport_expiry',
            'id_card_number', 'id_card_expiry', 'birth_certificate_number',
            'driving_license_number', 'driving_license_expiry',
            
            # Informations professionnelles
            'profession', 'employer', 'work_phone',
            
            # Informations familiales
            'marital_status', 'spouse_name', 'children_count',
            
            # Adresse
            'address_line1', 'address_line2', 'city', 'postal_code', 'country',
            
            # Contact d'urgence
            'emergency_contact_name', 'emergency_contact_phone'
        ]

    def validate_work_phone(self, value):
        if not value:
            return ''
        val = value.strip()
        if len(val) > 30:
            raise serializers.ValidationError("Numéro de téléphone professionnel trop long (max 30 caractères).")
        import re
        if not re.match(r'^\+?1?\d{9,15}$', val):
            raise serializers.ValidationError("Format de numéro de téléphone invalide. Utilisez un format international, ex: +221771234567")
        return val

    def validate_emergency_contact_phone(self, value):
        if not value:
            return ''
        val = value.strip()
        if len(val) > 30:
            raise serializers.ValidationError("Numéro de contact d'urgence trop long (max 30 caractères).")
        import re
        if not re.match(r'^\+?1?\d{9,15}$', val):
            raise serializers.ValidationError("Format de numéro de téléphone invalide. Utilisez un format international, ex: +221771234567")
        return val


class UserDocumentSerializer(serializers.ModelSerializer):
    """Serializer pour les documents utilisateur"""
    file_url = serializers.SerializerMethodField()
    status = serializers.ReadOnlyField()
    hashed_id = serializers.SerializerMethodField()
    
    class Meta:
        model = UserDocument
        fields = [
            'id', 'hashed_id', 'document_type', 'name', 'file', 'file_url',
            'expiry_date', 'upload_date', 'is_verified', 'notes', 'status'
        ]
        read_only_fields = ['id', 'hashed_id', 'upload_date', 'status']
    
    def get_hashed_id(self, obj):
        """Return hashed ID for secure URL generation"""
        return hashids_encode(obj.id)
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

