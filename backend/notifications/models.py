"""
Notification models for email, SMS, and push notifications
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class NotificationTemplate(models.Model):
    """
    Email/SMS templates for various notifications
    """
    class NotificationType(models.TextChoices):
        APPOINTMENT_CONFIRMED = 'APT_CONFIRMED', _('Rendez-vous confirmé')
        APPOINTMENT_REMINDER = 'APT_REMINDER', _('Rappel de rendez-vous')
        APPOINTMENT_CANCELLED = 'APT_CANCELLED', _('Rendez-vous annulé')
        APPLICATION_RECEIVED = 'APP_RECEIVED', _('Demande reçue')
        APPLICATION_STATUS_CHANGED = 'APP_STATUS', _('Statut de demande modifié')
        APPLICATION_READY = 'APP_READY', _('Demande prête')
        PAYMENT_RECEIVED = 'PAY_RECEIVED', _('Paiement reçu')
        PAYMENT_FAILED = 'PAY_FAILED', _('Paiement échoué')
        DOCUMENT_REQUIRED = 'DOC_REQUIRED', _('Document requis')
        ACCOUNT_VERIFICATION = 'ACC_VERIFY', _('Vérification de compte')
        PASSWORD_RESET = 'PWD_RESET', _('Réinitialisation de mot de passe')
        GENERAL = 'GENERAL', _('Général')
    
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        unique=True,
        verbose_name=_('Type de notification')
    )
    
    # Email fields
    email_subject = models.CharField(max_length=200, blank=True, verbose_name=_('Sujet email'))
    email_body = models.TextField(blank=True, verbose_name=_('Corps email'))
    email_html_body = models.TextField(blank=True, verbose_name=_('Corps HTML email'))
    
    # SMS fields
    sms_body = models.TextField(blank=True, verbose_name=_('Corps SMS'), max_length=160)
    
    # Push notification fields
    push_title = models.CharField(max_length=100, blank=True, verbose_name=_('Titre push'))
    push_body = models.TextField(blank=True, verbose_name=_('Corps push'), max_length=200)
    
    # Settings
    send_email = models.BooleanField(default=True, verbose_name=_('Envoyer email'))
    send_sms = models.BooleanField(default=False, verbose_name=_('Envoyer SMS'))
    send_push = models.BooleanField(default=True, verbose_name=_('Envoyer push'))
    
    is_active = models.BooleanField(default=True, verbose_name=_('Actif'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Modèle de notification')
        verbose_name_plural = _('Modèles de notifications')
    
    def __str__(self):
        return self.get_notification_type_display()


class Notification(models.Model):
    """
    Individual notification records sent to users
    """
    class Channel(models.TextChoices):
        EMAIL = 'EMAIL', _('Email')
        SMS = 'SMS', _('SMS')
        PUSH = 'PUSH', _('Push')
        IN_APP = 'IN_APP', _('In-App')
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('En attente')
        SENT = 'SENT', _('Envoyé')
        DELIVERED = 'DELIVERED', _('Délivré')
        FAILED = 'FAILED', _('Échoué')
        READ = 'READ', _('Lu')
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name=_('Destinataire')
    )
    
    channel = models.CharField(
        max_length=10,
        choices=Channel.choices,
        verbose_name=_('Canal')
    )
    
    # Content
    title = models.CharField(max_length=200, verbose_name=_('Titre'))
    message = models.TextField(verbose_name=_('Message'))
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name=_('Statut')
    )
    
    # Metadata
    notification_type = models.CharField(max_length=50, blank=True, verbose_name=_('Type'))
    related_object_type = models.CharField(max_length=50, blank=True, verbose_name=_('Type d\'objet'))
    related_object_id = models.CharField(max_length=50, blank=True, verbose_name=_('ID d\'objet'))
    
    # Delivery details
    provider_response = models.JSONField(default=dict, blank=True, verbose_name=_('Réponse fournisseur'))
    error_message = models.TextField(blank=True, verbose_name=_('Message d\'erreur'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Envoyé le'))
    read_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Lu le'))
    
    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status', '-created_at']),
            models.Index(fields=['channel', 'status']),
        ]
    
    def __str__(self):
        return f"{self.get_channel_display()} - {self.recipient.get_full_name()} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if self.status != self.Status.READ:
            from django.utils import timezone
            self.status = self.Status.READ
            self.read_at = timezone.now()
            self.save()


class PushDevice(models.Model):
    """
    User devices registered for push notifications (FCM tokens)
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_devices',
        verbose_name=_('Utilisateur')
    )
    
    # FCM token
    token = models.CharField(max_length=255, unique=True, verbose_name=_('Token'))
    
    # Device info
    device_name = models.CharField(max_length=100, blank=True, verbose_name=_('Nom de l\'appareil'))
    device_type = models.CharField(max_length=20, blank=True, verbose_name=_('Type d\'appareil'))
    
    is_active = models.BooleanField(default=True, verbose_name=_('Actif'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used = models.DateTimeField(auto_now=True, verbose_name=_('Dernière utilisation'))
    
    class Meta:
        verbose_name = _('Appareil push')
        verbose_name_plural = _('Appareils push')
        ordering = ['-last_used']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.device_name or self.device_type}"

