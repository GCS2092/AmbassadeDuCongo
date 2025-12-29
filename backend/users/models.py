"""
User models for the Embassy PWA
Includes custom User model and Profile with consular information
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator, FileExtensionValidator
from core.encrypted_fields import EncryptedCharField, EncryptedTextField
import uuid
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    Supports role-based access control
    """
    class Role(models.TextChoices):
        CITIZEN = 'CITIZEN', _('Citoyen')
        AGENT_RDV = 'AGENT_RDV', _('Agent Rendez-vous')
        AGENT_CONSULAIRE = 'AGENT_CONSULAIRE', _('Agent Consulaire')
        VIGILE = 'VIGILE', _('Vigile/Sécurité')
        ADMIN = 'ADMIN', _('Administrateur')
        SUPERADMIN = 'SUPERADMIN', _('Super Administrateur')
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CITIZEN,
        verbose_name=_('Rôle')
    )
    email = models.EmailField(_('Email'), unique=True)
    phone_number = EncryptedCharField(
        max_length=512,  # Increased to accommodate encrypted data (was 200)
        blank=True,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message=_('Format de numéro de téléphone invalide.')
        )],
        verbose_name=_('Numéro de téléphone')
    )
    consular_card_number = EncryptedCharField(
        max_length=200,  # Increased to accommodate encrypted data
        blank=True,
        null=True,
        unique=True,
        validators=[RegexValidator(
            regex=r'^SN\d{7,9}$',
            message=_('Format de numéro de carte consulaire invalide. Format attendu: SN suivi de 7 à 9 chiffres (ex: SN1234567)')
        )],
        verbose_name=_('Numéro de carte consulaire'),
        help_text=_('Format: SN suivi de 7 à 9 chiffres (ex: SN1234567) - Chiffré en base de données')
    )
    is_verified = models.BooleanField(default=False, verbose_name=_('Email vérifié'))
    is_2fa_enabled = models.BooleanField(default=False, verbose_name=_('2FA activé'))
    
    # Override username field to make it non-unique if needed
    username = models.CharField(
        _('username'),
        max_length=150,
        unique=True,
        help_text=_('Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.'),
        validators=[AbstractUser.username_validator],
        error_messages={
            'unique': _("A user with that username already exists."),
        },
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = _('Utilisateur')
        verbose_name_plural = _('Utilisateurs')
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"


class EmailVerificationCode(models.Model):
    """
    Model to store email verification codes
    """
    
    def default_expiry():
        """Return datetime 1 hour from now"""
        return timezone.now() + timedelta(hours=1)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_codes')
    code = models.CharField(max_length=6, unique=True)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expiry)
    is_used = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('Code de vérification email')
        verbose_name_plural = _('Codes de vérification email')
        ordering = ['-created_at']

    def __str__(self):
        return f"Code {self.code} pour {self.email}"

    @classmethod
    def generate_code(cls):
        """Generate a 6-digit verification code"""
        import random
        return str(random.randint(100000, 999999))
    
    def is_valid(self):
        """Retourne True si le code n'est pas utilisé et pas expiré"""
        return not self.is_used and self.expires_at >= timezone.now()


class Profile(models.Model):
    """
    Extended user profile with consular information
    Acts as a digital identity card
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Personal Information
    date_of_birth = models.DateField(null=True, blank=True, verbose_name=_('Date de naissance'))
    place_of_birth = models.CharField(max_length=200, blank=True, verbose_name=_('Lieu de naissance'))
    gender = models.CharField(
        max_length=10,
        choices=[
            ('M', _('Masculin')),
            ('F', _('Féminin')),
            ('O', _('Autre')),
        ],
        blank=True,
        verbose_name=_('Sexe')
    )
    nationality = models.CharField(max_length=100, blank=True, verbose_name=_('Nationalité'))
    
    # Gestion de plusieurs noms et prénoms (pour cohérence gouvernementale)
    # Les prénoms multiples sont stockés dans une liste JSON
    additional_first_names = models.JSONField(
        default=list,
        blank=True,
        help_text=_('Liste des prénoms supplémentaires (ex: ["Marie", "Sophie"])'),
        verbose_name=_('Prénoms supplémentaires')
    )
    # Nom de naissance (nom de famille à la naissance)
    birth_last_name = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Nom de famille à la naissance'),
        verbose_name=_('Nom de naissance')
    )
    # Nom d'usage (nom utilisé actuellement, peut être différent du nom de naissance)
    used_last_name = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Nom d\'usage (nom utilisé actuellement)'),
        verbose_name=_('Nom d\'usage')
    )
    # Noms de famille supplémentaires (pour les noms composés)
    additional_last_names = models.JSONField(
        default=list,
        blank=True,
        help_text=_('Liste des noms de famille supplémentaires (ex: ["Dupont", "Martin"])'),
        verbose_name=_('Noms de famille supplémentaires')
    )
    
    # Consular Information - ENCRYPTED
    consular_number = EncryptedCharField(
        max_length=200,  # Increased to accommodate encrypted data
        blank=True,
        unique=True,
        null=True,
        verbose_name=_('Numéro consulaire'),
        help_text=_('Chiffré en base de données')
    )
    passport_number = EncryptedCharField(
        max_length=200,  # Increased to accommodate encrypted data
        blank=True,
        null=True,
        verbose_name=_('Numéro de passeport'),
        help_text=_('Chiffré en base de données')
    )
    passport_expiry = models.DateField(null=True, blank=True, verbose_name=_('Date d\'expiration passeport'))

    # Additional Identity Documents - ENCRYPTED
    id_card_number = EncryptedCharField(
        max_length=200,  # Increased to accommodate encrypted data
        blank=True,
        null=True,
        verbose_name=_('Numéro de carte d\'identité'),
        help_text=_('Chiffré en base de données')
    )
    id_card_expiry = models.DateField(null=True, blank=True, verbose_name=_('Date d\'expiration carte d\'identité'))
    birth_certificate_number = EncryptedCharField(
        max_length=200,  # Increased to accommodate encrypted data
        blank=True,
        null=True,
        verbose_name=_('Numéro d\'acte de naissance'),
        help_text=_('Chiffré en base de données')
    )
    driving_license_number = EncryptedCharField(
        max_length=200,  # Increased to accommodate encrypted data
        blank=True,
        null=True,
        verbose_name=_('Numéro de permis de conduire'),
        help_text=_('Chiffré en base de données')
    )
    driving_license_expiry = models.DateField(null=True, blank=True, verbose_name=_('Date d\'expiration permis'))

    # Professional Information
    profession = models.CharField(max_length=200, blank=True, verbose_name=_('Profession'))
    employer = models.CharField(max_length=200, blank=True, verbose_name=_('Employeur'))
    work_phone = EncryptedCharField(
        max_length=200,  # Increased to accommodate encrypted data
        blank=True,
        verbose_name=_('Téléphone professionnel'),
        help_text=_('Chiffré en base de données')
    )

    # Family Information
    marital_status = models.CharField(
        max_length=20,
        choices=[
            ('single', 'Célibataire'),
            ('married', 'Marié(e)'),
            ('divorced', 'Divorcé(e)'),
            ('widowed', 'Veuf/Veuve'),
        ],
        blank=True,
        verbose_name=_('Statut matrimonial')
    )
    spouse_name = models.CharField(max_length=200, blank=True, verbose_name=_('Nom du conjoint'))
    children_count = models.PositiveIntegerField(default=0, verbose_name=_('Nombre d\'enfants'))
    
    # Address Information
    address_line1 = models.CharField(max_length=255, blank=True, verbose_name=_('Adresse ligne 1'))
    address_line2 = models.CharField(max_length=255, blank=True, verbose_name=_('Adresse ligne 2'))
    city = models.CharField(max_length=100, blank=True, verbose_name=_('Ville'))
    postal_code = models.CharField(max_length=20, blank=True, verbose_name=_('Code postal'))
    country = models.CharField(max_length=100, blank=True, verbose_name=_('Pays'))
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=200, blank=True, verbose_name=_('Contact d\'urgence - Nom'))
    emergency_contact_phone = EncryptedCharField(
        max_length=200,  # Increased to accommodate encrypted data
        blank=True,
        verbose_name=_('Contact d\'urgence - Téléphone'),
        help_text=_('Chiffré en base de données')
    )
    
    # Profile Status
    photo = models.ImageField(upload_to='profiles/', null=True, blank=True, verbose_name=_('Photo de profil'))
    documents_complete = models.BooleanField(default=False, verbose_name=_('Documents complets'))
    is_profile_complete = models.BooleanField(default=False, verbose_name=_('Profil complet'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Profil')
        verbose_name_plural = _('Profils')
    
    def __str__(self):
        return f"Profil de {self.user.get_full_name()}"
    
    def get_all_first_names(self):
        """Retourne tous les prénoms (premier prénom + prénoms supplémentaires)"""
        first_names = [self.user.first_name] if self.user.first_name else []
        if self.additional_first_names:
            first_names.extend(self.additional_first_names)
        return first_names
    
    def get_all_last_names(self):
        """Retourne tous les noms de famille"""
        last_names = []
        # Nom principal (last_name)
        if self.user.last_name:
            last_names.append(self.user.last_name)
        # Nom de naissance
        if self.birth_last_name and self.birth_last_name != self.user.last_name:
            last_names.append(self.birth_last_name)
        # Nom d'usage
        if self.used_last_name and self.used_last_name not in last_names:
            last_names.append(self.used_last_name)
        # Noms supplémentaires
        if self.additional_last_names:
            for name in self.additional_last_names:
                if name not in last_names:
                    last_names.append(name)
        return last_names
    
    def get_full_name_extended(self):
        """Retourne le nom complet avec tous les prénoms et noms"""
        first_names = self.get_all_first_names()
        last_names = self.get_all_last_names()
        return f"{' '.join(first_names)} {' '.join(last_names)}".strip()
    
    def get_display_name(self):
        """Retourne le nom d'affichage (premier prénom + nom d'usage ou nom principal)"""
        first_name = self.user.first_name or ''
        last_name = self.used_last_name or self.user.last_name or ''
        return f"{first_name} {last_name}".strip()
    
    def get_full_address(self):
        """Return formatted full address"""
        parts = [self.address_line1, self.address_line2, self.city, self.postal_code, self.country]
        return ', '.join(filter(None, parts))
    
    def calculate_completeness(self):
        """Calculate profile completeness percentage"""
        required_fields = [
            self.date_of_birth, self.place_of_birth, self.gender, self.nationality,
            self.address_line1, self.city, self.country,
            self.emergency_contact_name, self.emergency_contact_phone
        ]
        
        filled_fields = sum(1 for field in required_fields if field)
        return (filled_fields / len(required_fields)) * 100
    
    def save(self, *args, **kwargs):
        """Override save to update completeness"""
        completeness = self.calculate_completeness()
        self.is_profile_complete = completeness >= 80
        super().save(*args, **kwargs)


class UserDocument(models.Model):
    """Modèle pour stocker les documents scannés des utilisateurs"""
    
    DOCUMENT_TYPES = [
        ('passport', _('Passeport')),
        ('id_card', _('Carte d\'identité')),
        ('consular_card', _('Carte consulaire')),
        ('driving_license', _('Permis de conduire')),
        ('birth_certificate', _('Acte de naissance')),
        ('marriage_certificate', _('Acte de mariage')),
        ('other', _('Autre document')),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES, verbose_name=_('Type de document'))
    name = models.CharField(max_length=255, verbose_name=_('Nom du document'))
    file = models.FileField(
        upload_to='user_documents/%Y/%m/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'])],
        verbose_name=_('Fichier')
    )
    expiry_date = models.DateField(null=True, blank=True, verbose_name=_('Date d\'expiration'))
    upload_date = models.DateTimeField(auto_now_add=True, verbose_name=_('Date d\'upload'))
    is_verified = models.BooleanField(default=False, verbose_name=_('Vérifié'))
    notes = models.TextField(blank=True, verbose_name=_('Notes'))
    
    class Meta:
        verbose_name = _('Document utilisateur')
        verbose_name_plural = _('Documents utilisateur')
        ordering = ['-upload_date']
    
    def __str__(self):
        return f"{self.name} - {self.user.get_full_name()}"
    
    @property
    def is_expired(self):
        """Vérifie si le document est expiré"""
        if not self.expiry_date:
            return False
        return self.expiry_date < timezone.now().date()
    
    @property
    def expires_soon(self):
        """Vérifie si le document expire bientôt (30 jours)"""
        if not self.expiry_date:
            return False
        return (self.expiry_date - timezone.now().date()).days <= 30
    
    @property
    def status(self):
        """Retourne le statut du document"""
        if self.is_expired:
            return 'expired'
        elif self.expires_soon:
            return 'expiring_soon'
        return 'valid'


class DocumentReminder(models.Model):
    """Modèle pour suivre les rappels de documents qui expirent"""
    
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('PROCESSING', 'En cours'),
        ('COMPLETED', 'Traité'),
        ('IGNORED', 'Ignoré'),
    ]
    
    PRIORITY_CHOICES = [
        ('URGENT', 'Urgent (< 3 jours)'),
        ('HIGH', 'Important (< 7 jours)'),
        ('MEDIUM', 'Rappel (< 30 jours)'),
    ]
    
    document = models.ForeignKey(UserDocument, on_delete=models.CASCADE, related_name='reminders')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_reminders')
    
    # Informations de rappel
    expiry_date = models.DateField(verbose_name=_('Date d\'expiration'))
    days_until_expiry = models.IntegerField(verbose_name=_('Jours avant expiration'))
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, verbose_name=_('Priorité'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name=_('Statut'))
    
    # Notifications
    email_sent = models.BooleanField(default=False, verbose_name=_('Email envoyé'))
    email_sent_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Date d\'envoi email'))
    notification_sent = models.BooleanField(default=False, verbose_name=_('Notification envoyée'))
    
    # Suivi
    notes = models.TextField(blank=True, verbose_name=_('Notes'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    handled_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Date de traitement'))
    
    class Meta:
        verbose_name = _('Rappel de document')
        verbose_name_plural = _('Rappels de documents')
        ordering = ['expiry_date', '-priority']
        unique_together = [['document', 'user']]
    
    def __str__(self):
        return f"{self.document.name} - {self.user.get_full_name()} (Expire le {self.expiry_date})"
    
    @property
    def is_urgent(self):
        """Document expire dans moins de 3 jours"""
        return self.days_until_expiry <= 3
    
    @property
    def needs_reminder(self):
        """Vérifie si un rappel doit être envoyé"""
        return (
            self.status == 'PENDING' and
            self.days_until_expiry <= 3 and
            not self.email_sent
        )