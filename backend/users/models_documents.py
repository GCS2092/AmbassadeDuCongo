"""
Modèle pour la gestion des documents utilisateur
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import FileExtensionValidator
from .models import User


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
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
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
        from django.utils import timezone
        return self.expiry_date < timezone.now().date()
    
    @property
    def expires_soon(self):
        """Vérifie si le document expire bientôt (30 jours)"""
        if not self.expiry_date:
            return False
        from django.utils import timezone
        from datetime import timedelta
        return (self.expiry_date - timezone.now().date()).days <= 30
    
    @property
    def status(self):
        """Retourne le statut du document"""
        if self.is_expired:
            return 'expired'
        elif self.expires_soon:
            return 'expiring_soon'
        return 'valid'
