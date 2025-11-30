"""
Core models: ConsularOffice, ServiceType, Announcement, AuditLog, FAQ, Feedback
Essential infrastructure for the Embassy PWA
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.conf import settings


class ConsularOffice(models.Model):
    """
    Represents an Embassy or Consulate location
    Stores address, contact info, and geo-coordinates for map display
    """
    class OfficeType(models.TextChoices):
        EMBASSY = 'EMBASSY', _('Ambassade')
        CONSULATE = 'CONSULATE', _('Consulat')
        CONSULAR_SECTION = 'SECTION', _('Section Consulaire')
    
    name = models.CharField(max_length=200, verbose_name=_('Nom'))
    office_type = models.CharField(
        max_length=20,
        choices=OfficeType.choices,
        default=OfficeType.EMBASSY,
        verbose_name=_('Type')
    )
    
    # Address Information
    address_line1 = models.CharField(max_length=255, verbose_name=_('Adresse ligne 1'))
    address_line2 = models.CharField(max_length=255, blank=True, verbose_name=_('Adresse ligne 2'))
    city = models.CharField(max_length=100, verbose_name=_('Ville'))
    postal_code = models.CharField(max_length=20, blank=True, verbose_name=_('Code postal'))
    country = models.CharField(max_length=100, default='Sénégal', verbose_name=_('Pays'))
    
    # Geo-coordinates for map display
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name=_('Latitude')
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name=_('Longitude')
    )
    
    # Contact Information
    phone_primary = models.CharField(max_length=20, verbose_name=_('Téléphone principal'))
    phone_secondary = models.CharField(max_length=20, blank=True, verbose_name=_('Téléphone secondaire'))
    email = models.EmailField(verbose_name=_('Email'))
    emergency_phone = models.CharField(max_length=20, blank=True, verbose_name=_('Téléphone d\'urgence'))
    
    # Operating Hours (stored as JSON-like text for flexibility)
    opening_hours = models.TextField(
        blank=True,
        help_text=_('Horaires d\'ouverture (ex: Lun-Ven 9h-17h)'),
        verbose_name=_('Horaires d\'ouverture')
    )
    
    # Jurisdiction
    jurisdiction_countries = models.TextField(
        blank=True,
        help_text=_('Pays couverts par cette ambassade/consulat'),
        verbose_name=_('Juridiction')
    )
    
    # Status
    is_active = models.BooleanField(default=True, verbose_name=_('Actif'))
    accepts_appointments = models.BooleanField(default=True, verbose_name=_('Accepte les rendez-vous'))
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Bureau Consulaire')
        verbose_name_plural = _('Bureaux Consulaires')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.city}"
    
    @property
    def full_address(self):
        """Return formatted full address"""
        parts = [self.address_line1]
        if self.address_line2:
            parts.append(self.address_line2)
        parts.extend([self.city, self.postal_code, self.country])
        return ', '.join(filter(None, parts))


class ServiceType(models.Model):
    """
    Types of consular services offered (Visa, Passport, Legalization, etc.)
    """
    class Category(models.TextChoices):
        VISA = 'VISA', _('Visa')
        PASSPORT = 'PASSPORT', _('Passeport')
        CIVIL_ACTS = 'CIVIL', _('Actes Civils')
        LEGALIZATION = 'LEGAL', _('Légalisation')
        ATTESTATION = 'ATTEST', _('Attestation')
        OTHER = 'OTHER', _('Autre')
    
    name = models.CharField(max_length=200, verbose_name=_('Nom du service'))
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        verbose_name=_('Catégorie')
    )
    description = models.TextField(blank=True, verbose_name=_('Description'))
    
    # Requirements
    required_documents = models.TextField(
        blank=True,
        help_text=_('Liste des documents requis (un par ligne)'),
        verbose_name=_('Documents requis')
    )
    
    # Pricing
    base_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name=_('Frais de base (XOF)')
    )
    
    # Processing Time
    processing_time_days = models.IntegerField(
        default=5,
        help_text=_('Délai de traitement estimé en jours'),
        verbose_name=_('Délai de traitement')
    )
    
    # Availability
    offices = models.ManyToManyField(
        ConsularOffice,
        related_name='services',
        verbose_name=_('Bureaux offrant ce service')
    )
    is_active = models.BooleanField(default=True, verbose_name=_('Actif'))
    requires_appointment = models.BooleanField(default=True, verbose_name=_('Nécessite rendez-vous'))
    
    # Metadata
    display_order = models.IntegerField(default=0, verbose_name=_('Ordre d\'affichage'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Type de Service')
        verbose_name_plural = _('Types de Services')
        ordering = ['display_order', 'category', 'name']
    
    def __str__(self):
        return f"{self.get_category_display()} - {self.name}"


class Announcement(models.Model):
    """
    Public announcements displayed on the embassy website/PWA
    """
    class Priority(models.TextChoices):
        LOW = 'LOW', _('Basse')
        NORMAL = 'NORMAL', _('Normale')
        HIGH = 'HIGH', _('Haute')
        URGENT = 'URGENT', _('Urgente')
    
    title = models.CharField(max_length=255, verbose_name=_('Titre'))
    content = models.TextField(verbose_name=_('Contenu'))
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.NORMAL,
        verbose_name=_('Priorité')
    )
    
    # Publishing
    office = models.ForeignKey(
        ConsularOffice,
        on_delete=models.CASCADE,
        related_name='announcements',
        null=True,
        blank=True,
        verbose_name=_('Bureau')
    )
    is_pinned = models.BooleanField(default=False, verbose_name=_('Épinglé'))
    is_published = models.BooleanField(default=False, verbose_name=_('Publié'))
    publish_from = models.DateTimeField(verbose_name=_('Date de publication'))
    publish_to = models.DateTimeField(null=True, blank=True, verbose_name=_('Date d\'expiration'))
    
    # Targeting
    target_all_users = models.BooleanField(default=True, verbose_name=_('Visible par tous'))
    target_roles = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Rôles ciblés (séparés par des virgules)'),
        verbose_name=_('Rôles ciblés')
    )
    
    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='announcements_created',
        verbose_name=_('Créé par')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Annonce')
        verbose_name_plural = _('Annonces')
        ordering = ['-is_pinned', '-priority', '-publish_from']
    
    def __str__(self):
        return self.title


class AuditLog(models.Model):
    """
    Comprehensive audit trail for all sensitive operations
    Tracks who did what, when, and on which object
    """
    class Action(models.TextChoices):
        CREATE = 'CREATE', _('Création')
        UPDATE = 'UPDATE', _('Modification')
        DELETE = 'DELETE', _('Suppression')
        VIEW = 'VIEW', _('Consultation')
        APPROVE = 'APPROVE', _('Approbation')
        REJECT = 'REJECT', _('Rejet')
        DOWNLOAD = 'DOWNLOAD', _('Téléchargement')
        LOGIN = 'LOGIN', _('Connexion')
        LOGIN_FAILED = 'LOGIN_FAILED', _('Tentative de connexion échouée')
        LOGOUT = 'LOGOUT', _('Déconnexion')
        PAYMENT = 'PAYMENT', _('Paiement')
        CHANGE_ROLE = 'CHANGE_ROLE', _('Changement de rôle')
        ACTIVATE_USER = 'ACTIVATE_USER', _('Activation utilisateur')
        DEACTIVATE_USER = 'DEACTIVATE_USER', _('Désactivation utilisateur')
        PASSWORD_RESET = 'PASSWORD_RESET', _('Réinitialisation mot de passe')
    
    # Actor
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        verbose_name=_('Utilisateur')
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name=_('Adresse IP'))
    user_agent = models.TextField(blank=True, verbose_name=_('User Agent'))
    
    # Action
    action = models.CharField(max_length=20, choices=Action.choices, verbose_name=_('Action'))
    description = models.TextField(blank=True, verbose_name=_('Description'))
    
    # Target Object (using Generic Foreign Key for flexibility)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Additional data (stored as JSON-compatible text)
    metadata = models.JSONField(default=dict, blank=True, verbose_name=_('Métadonnées'))
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name=_('Date et heure'))
    
    class Meta:
        verbose_name = _('Journal d\'audit')
        verbose_name_plural = _('Journaux d\'audit')
        ordering = ['-timestamp']  # Plus récent en premier
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
        ]
    
    def __str__(self):
        user_str = self.user.get_full_name() if self.user else 'Anonyme'
        return f"{user_str} - {self.get_action_display()} - {self.timestamp}"


class SiteSettings(models.Model):
    """
    Paramètres globaux du site - Permet de désactiver des fonctionnalités
    Géré uniquement par les administrateurs
    """
    # Paramètres d'inscription
    registration_enabled = models.BooleanField(
        default=True,
        verbose_name=_('Inscription activée'),
        help_text=_('Permet aux nouveaux utilisateurs de s\'inscrire')
    )
    registration_message = models.TextField(
        default='Merci de votre sollicitude. Nous vous prions de passer à l\'ambassade pour effectuer cette tâche.',
        verbose_name=_('Message d\'inscription désactivée'),
        help_text=_('Message affiché lorsque l\'inscription est désactivée')
    )
    
    # Paramètres de rendez-vous
    appointments_enabled = models.BooleanField(
        default=True,
        verbose_name=_('Rendez-vous activés'),
        help_text=_('Permet aux utilisateurs de prendre des rendez-vous')
    )
    appointments_message = models.TextField(
        default='Merci de votre sollicitude. Nous vous prions de passer à l\'ambassade pour effectuer cette tâche.',
        verbose_name=_('Message rendez-vous désactivés')
    )
    
    # Paramètres de demandes
    applications_enabled = models.BooleanField(
        default=True,
        verbose_name=_('Demandes activées'),
        help_text=_('Permet aux utilisateurs de soumettre des demandes')
    )
    applications_message = models.TextField(
        default='Merci de votre sollicitude. Nous vous prions de passer à l\'ambassade pour effectuer cette tâche.',
        verbose_name=_('Message demandes désactivées')
    )
    
    # Paramètres de paiement
    payments_enabled = models.BooleanField(
        default=True,
        verbose_name=_('Paiements activés'),
        help_text=_('Permet aux utilisateurs d\'effectuer des paiements en ligne')
    )
    payments_message = models.TextField(
        default='Merci de votre sollicitude. Nous vous prions de passer à l\'ambassade pour effectuer cette tâche.',
        verbose_name=_('Message paiements désactivés')
    )
    
    # Paramètres généraux
    site_maintenance_mode = models.BooleanField(
        default=False,
        verbose_name=_('Mode maintenance'),
        help_text=_('Désactive toutes les fonctionnalités publiques (sauf connexion admin)')
    )
    maintenance_message = models.TextField(
        default='Le site est actuellement en maintenance. Merci de votre compréhension.',
        verbose_name=_('Message de maintenance')
    )
    
    # Métadonnées
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Dernière modification'))
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='site_settings_updates',
        verbose_name=_('Modifié par')
    )
    
    class Meta:
        verbose_name = _('Paramètres du site')
        verbose_name_plural = _('Paramètres du site')
        # Singleton pattern - un seul objet
        constraints = [
            models.CheckConstraint(check=models.Q(id=1), name='single_site_settings')
        ]
    
    def __str__(self):
        return 'Paramètres du site'
    
    def save(self, *args, **kwargs):
        # Forcer l'ID à 1 pour le singleton
        self.id = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Récupère les paramètres (crée si n'existe pas)"""
        settings, created = cls.objects.get_or_create(id=1)
        return settings


class FAQ(models.Model):
    """
    Frequently Asked Questions for public display
    """
    class Category(models.TextChoices):
        VISA = 'VISA', _('Visa')
        PASSPORT = 'PASSPORT', _('Passeport')
        GENERAL = 'GENERAL', _('Général')
        APPOINTMENT = 'APPOINTMENT', _('Rendez-vous')
        PAYMENT = 'PAYMENT', _('Paiement')
        DOCUMENTS = 'DOCUMENTS', _('Documents')
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL,
        verbose_name=_('Catégorie')
    )
    question = models.CharField(max_length=500, verbose_name=_('Question'))
    answer = models.TextField(verbose_name=_('Réponse'))
    
    display_order = models.IntegerField(default=0, verbose_name=_('Ordre d\'affichage'))
    is_published = models.BooleanField(default=True, verbose_name=_('Publié'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('FAQ')
        verbose_name_plural = _('FAQs')
        ordering = ['category', 'display_order']
    
    def __str__(self):
        return f"[{self.get_category_display()}] {self.question[:50]}"


class Feedback(models.Model):
    """
    User feedback for continuous improvement (GRATUIT)
    """
    class Rating(models.TextChoices):
        POSITIVE = 'POSITIVE', _('Positif')
        NEGATIVE = 'NEGATIVE', _('Négatif')
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='feedbacks',
        verbose_name=_('Utilisateur')
    )
    
    page = models.CharField(max_length=100, verbose_name=_('Page'))
    context = models.CharField(max_length=255, blank=True, verbose_name=_('Contexte'))
    rating = models.CharField(max_length=10, choices=Rating.choices, verbose_name=_('Avis'))
    comment = models.TextField(blank=True, verbose_name=_('Commentaire'))
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Follow-up
    is_resolved = models.BooleanField(default=False, verbose_name=_('Traité'))
    admin_notes = models.TextField(blank=True, verbose_name=_('Notes admin'))
    
    class Meta:
        verbose_name = _('Retour utilisateur')
        verbose_name_plural = _('Retours utilisateurs')
        ordering = ['-created_at']
    
    def __str__(self):
        user_str = self.user.get_full_name() if self.user else 'Anonyme'
        return f"{user_str} - {self.get_rating_display()} - {self.page}"
