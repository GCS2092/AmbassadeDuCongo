"""
Application models for visa/passport/document requests
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import FileExtensionValidator
from core.models import ServiceType, ConsularOffice
import uuid
import os


def get_document_upload_path(instance, filename):
    """Generate secure upload path for documents"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join('documents', str(instance.owner.id), filename)


class Document(models.Model):
    """
    Uploaded documents (passports, photos, supporting docs, etc.)
    """
    class DocumentType(models.TextChoices):
        PASSPORT = 'PASSPORT', _('Passeport')
        ID_CARD = 'ID_CARD', _('Carte d\'identité')
        PHOTO = 'PHOTO', _('Photo d\'identité')
        BIRTH_CERTIFICATE = 'BIRTH_CERT', _('Acte de naissance')
        MARRIAGE_CERTIFICATE = 'MARRIAGE_CERT', _('Acte de mariage')
        PROOF_OF_RESIDENCE = 'RESIDENCE', _('Justificatif de domicile')
        INVITATION_LETTER = 'INVITATION', _('Lettre d\'invitation')
        WORK_PERMIT = 'WORK_PERMIT', _('Permis de travail')
        OTHER = 'OTHER', _('Autre')
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name=_('Propriétaire')
    )
    
    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices,
        verbose_name=_('Type de document')
    )
    file = models.FileField(
        upload_to=get_document_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        verbose_name=_('Fichier')
    )
    original_filename = models.CharField(max_length=255, verbose_name=_('Nom du fichier'))
    file_size = models.IntegerField(verbose_name=_('Taille (octets)'))
    
    # Verification
    is_verified = models.BooleanField(default=False, verbose_name=_('Vérifié'))
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_documents',
        verbose_name=_('Vérifié par')
    )
    verified_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Vérifié le'))
    verification_notes = models.TextField(blank=True, verbose_name=_('Notes de vérification'))
    
    # Metadata
    description = models.CharField(max_length=500, blank=True, verbose_name=_('Description'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Document')
        verbose_name_plural = _('Documents')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.owner.get_full_name()}"
    
    def save(self, *args, **kwargs):
        if self.file and not self.file_size:
            self.file_size = self.file.size
        if self.file and not self.original_filename:
            self.original_filename = os.path.basename(self.file.name)
        super().save(*args, **kwargs)


class Application(models.Model):
    """
    Generic application for consular services (Visa, Passport, etc.)
    """
    class ApplicationType(models.TextChoices):
        VISA = 'VISA', _('Visa')
        PASSPORT = 'PASSPORT', _('Passeport')
        PASSPORT_RENEWAL = 'PASSPORT_RENEWAL', _('Renouvellement de passeport')
        BIRTH_CERTIFICATE = 'BIRTH_CERT', _('Acte de naissance')
        MARRIAGE_CERTIFICATE = 'MARRIAGE_CERT', _('Acte de mariage')
        LEGALIZATION = 'LEGALIZATION', _('Légalisation de document')
        ATTESTATION = 'ATTESTATION', _('Attestation consulaire')
        OTHER = 'OTHER', _('Autre')
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Brouillon')
        SUBMITTED = 'SUBMITTED', _('Soumis')
        UNDER_REVIEW = 'UNDER_REVIEW', _('En cours de vérification')
        ADDITIONAL_INFO_REQUIRED = 'INFO_REQUIRED', _('Informations supplémentaires requises')
        PAYMENT_PENDING = 'PAYMENT_PENDING', _('En attente de paiement')
        PAYMENT_RECEIVED = 'PAYMENT_RECEIVED', _('Paiement reçu')
        PROCESSING = 'PROCESSING', _('En traitement')
        READY = 'READY', _('Prêt pour retrait')
        COMPLETED = 'COMPLETED', _('Terminé')
        REJECTED = 'REJECTED', _('Rejeté')
        CANCELLED = 'CANCELLED', _('Annulé')
    
    # Reference
    reference_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        verbose_name=_('Numéro de référence')
    )
    
    # Basic Info
    application_type = models.CharField(
        max_length=20,
        choices=ApplicationType.choices,
        verbose_name=_('Type de demande')
    )
    service_type = models.ForeignKey(
        ServiceType,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name=_('Service')
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name=_('Demandeur')
    )
    office = models.ForeignKey(
        ConsularOffice,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name=_('Bureau consulaire')
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name=_('Statut')
    )
    
    # Documents
    documents = models.ManyToManyField(
        Document,
        related_name='applications',
        blank=True,
        verbose_name=_('Documents')
    )
    
    # Assignment
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_applications',
        verbose_name=_('Agent assigné')
    )
    
    # Fees
    base_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name=_('Frais de base')
    )
    additional_fees = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name=_('Frais additionnels')
    )
    total_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name=_('Frais totaux')
    )
    
    # Notes and Communication
    applicant_notes = models.TextField(blank=True, verbose_name=_('Notes du demandeur'))
    admin_notes = models.TextField(blank=True, verbose_name=_('Notes administratives'))
    rejection_reason = models.TextField(blank=True, verbose_name=_('Motif de rejet'))
    
    # Metadata
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Soumis le'))
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Terminé le'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Demande')
        verbose_name_plural = _('Demandes')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['applicant', '-created_at']),
            models.Index(fields=['reference_number']),
        ]
    
    def __str__(self):
        return f"{self.reference_number} - {self.get_application_type_display()}"
    
    def save(self, *args, **kwargs):
        # Generate reference number
        if not self.reference_number:
            self.reference_number = self.generate_reference_number()
        
        # Calculate total fee
        self.total_fee = self.base_fee + self.additional_fees
        
        # Set submitted timestamp
        if self.status == self.Status.SUBMITTED and not self.submitted_at:
            from django.utils import timezone
            self.submitted_at = timezone.now()
        
        # Set completed timestamp
        if self.status == self.Status.COMPLETED and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_reference_number():
        """Generate unique reference number"""
        return f"APP-{uuid.uuid4().hex[:8].upper()}"
    
    @property
    def is_paid(self):
        """Check if application fees are paid"""
        return hasattr(self, 'payment') and self.payment.status == 'COMPLETED'
    
    @property
    def can_be_cancelled(self):
        """Check if application can be cancelled"""
        return self.status in [
            self.Status.DRAFT,
            self.Status.SUBMITTED,
            self.Status.UNDER_REVIEW,
            self.Status.PAYMENT_PENDING
        ]


class VisaApplication(models.Model):
    """
    Extended information specific to visa applications
    """
    class VisaType(models.TextChoices):
        TOURIST = 'TOURIST', _('Tourisme')
        BUSINESS = 'BUSINESS', _('Affaires')
        WORK = 'WORK', _('Travail')
        STUDY = 'STUDY', _('Études')
        FAMILY = 'FAMILY', _('Regroupement familial')
        TRANSIT = 'TRANSIT', _('Transit')
        OTHER = 'OTHER', _('Autre')
    
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='visa_details',
        verbose_name=_('Demande')
    )
    
    visa_type = models.CharField(
        max_length=20,
        choices=VisaType.choices,
        verbose_name=_('Type de visa')
    )
    
    # Travel Information
    purpose_of_visit = models.TextField(verbose_name=_('Motif du voyage'))
    intended_entry_date = models.DateField(verbose_name=_('Date d\'entrée prévue'))
    intended_departure_date = models.DateField(verbose_name=_('Date de sortie prévue'))
    duration_days = models.IntegerField(verbose_name=_('Durée (jours)'))
    
    # Destination
    destination_city = models.CharField(max_length=100, verbose_name=_('Ville de destination'))
    accommodation_address = models.TextField(blank=True, verbose_name=_('Adresse d\'hébergement'))
    
    # Sponsor/Contact
    sponsor_name = models.CharField(max_length=200, blank=True, verbose_name=_('Nom du parrain'))
    sponsor_phone = models.CharField(max_length=20, blank=True, verbose_name=_('Téléphone du parrain'))
    sponsor_address = models.TextField(blank=True, verbose_name=_('Adresse du parrain'))
    
    # Employment
    occupation = models.CharField(max_length=200, blank=True, verbose_name=_('Profession'))
    employer = models.CharField(max_length=200, blank=True, verbose_name=_('Employeur'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Détails de visa')
        verbose_name_plural = _('Détails de visas')
    
    def __str__(self):
        return f"Visa {self.get_visa_type_display()} - {self.application.reference_number}"


class PassportApplication(models.Model):
    """
    Extended information specific to passport applications
    """
    class PassportType(models.TextChoices):
        NEW = 'NEW', _('Nouveau')
        RENEWAL = 'RENEWAL', _('Renouvellement')
        REPLACEMENT = 'REPLACEMENT', _('Remplacement')
    
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='passport_details',
        verbose_name=_('Demande')
    )
    
    passport_type = models.CharField(
        max_length=20,
        choices=PassportType.choices,
        default=PassportType.NEW,
        verbose_name=_('Type de demande')
    )
    
    # Current Passport (for renewal/replacement)
    current_passport_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Numéro de passeport actuel')
    )
    current_passport_issue_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_('Date de délivrance')
    )
    current_passport_expiry_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_('Date d\'expiration')
    )
    
    # Reason for replacement (if applicable)
    replacement_reason = models.TextField(
        blank=True,
        verbose_name=_('Motif de remplacement')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Détails de passeport')
        verbose_name_plural = _('Détails de passeports')
    
    def __str__(self):
        return f"Passeport {self.get_passport_type_display()} - {self.application.reference_number}"

