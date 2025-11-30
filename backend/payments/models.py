"""
Payment models for handling consular service fees
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from applications.models import Application
import uuid


class Payment(models.Model):
    """
    Payment records for applications
    Supports multiple payment methods including Stripe and mobile money
    """
    class PaymentMethod(models.TextChoices):
        CREDIT_CARD = 'CARD', _('Carte bancaire')
        STRIPE = 'STRIPE', _('Stripe')
        ORANGE_MONEY = 'ORANGE', _('Orange Money')
        WAVE = 'WAVE', _('Wave')
        BANK_TRANSFER = 'TRANSFER', _('Virement bancaire')
        CASH = 'CASH', _('Espèces')
        OTHER = 'OTHER', _('Autre')
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('En attente')
        PROCESSING = 'PROCESSING', _('En cours')
        COMPLETED = 'COMPLETED', _('Terminé')
        FAILED = 'FAILED', _('Échoué')
        CANCELLED = 'CANCELLED', _('Annulé')
        REFUNDED = 'REFUNDED', _('Remboursé')
    
    # Reference
    transaction_id = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name=_('ID de transaction')
    )
    
    # Relationships
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name=_('Demande')
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name=_('Utilisateur')
    )
    
    # Amount
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_('Montant (XOF)')
    )
    currency = models.CharField(
        max_length=3,
        default='XOF',
        verbose_name=_('Devise')
    )
    
    # Payment Details
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        verbose_name=_('Méthode de paiement')
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name=_('Statut')
    )
    
    # Provider Information (Stripe, Orange Money, etc.)
    provider_transaction_id = models.CharField(
        max_length=255,
        blank=True,
        verbose_name=_('ID transaction fournisseur')
    )
    provider_reference = models.CharField(
        max_length=255,
        blank=True,
        verbose_name=_('Référence fournisseur')
    )
    provider_response = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_('Réponse fournisseur')
    )
    
    # Receipt
    receipt_number = models.CharField(
        max_length=50,
        blank=True,
        unique=True,
        null=True,
        verbose_name=_('Numéro de reçu')
    )
    receipt_url = models.URLField(blank=True, verbose_name=_('URL du reçu'))
    
    # Notes
    description = models.TextField(blank=True, verbose_name=_('Description'))
    admin_notes = models.TextField(blank=True, verbose_name=_('Notes administratives'))
    failure_reason = models.TextField(blank=True, verbose_name=_('Raison de l\'échec'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Terminé le'))
    
    class Meta:
        verbose_name = _('Paiement')
        verbose_name_plural = _('Paiements')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['transaction_id']),
        ]
    
    def __str__(self):
        return f"{self.transaction_id} - {self.amount} {self.currency}"
    
    def save(self, *args, **kwargs):
        # Generate transaction ID
        if not self.transaction_id:
            self.transaction_id = self.generate_transaction_id()
        
        # Generate receipt number when completed
        if self.status == self.Status.COMPLETED and not self.receipt_number:
            self.receipt_number = self.generate_receipt_number()
        
        # Set completed timestamp
        if self.status == self.Status.COMPLETED and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_transaction_id():
        """Generate unique transaction ID"""
        return f"TXN-{uuid.uuid4().hex[:12].upper()}"
    
    @staticmethod
    def generate_receipt_number():
        """Generate unique receipt number"""
        from django.utils import timezone
        date_str = timezone.now().strftime('%Y%m%d')
        unique_id = uuid.uuid4().hex[:6].upper()
        return f"RCP-{date_str}-{unique_id}"
    
    @property
    def is_successful(self):
        """Check if payment was successful"""
        return self.status == self.Status.COMPLETED


class Refund(models.Model):
    """
    Refund records for payments
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('En attente')
        PROCESSING = 'PROCESSING', _('En cours')
        COMPLETED = 'COMPLETED', _('Terminé')
        FAILED = 'FAILED', _('Échoué')
        CANCELLED = 'CANCELLED', _('Annulé')
    
    # Reference
    refund_id = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name=_('ID de remboursement')
    )
    
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='refunds',
        verbose_name=_('Paiement')
    )
    
    # Amount
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_('Montant remboursé')
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name=_('Statut')
    )
    
    # Reason
    reason = models.TextField(verbose_name=_('Motif du remboursement'))
    
    # Provider
    provider_refund_id = models.CharField(
        max_length=255,
        blank=True,
        verbose_name=_('ID remboursement fournisseur')
    )
    
    # Metadata
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='refunds_requested',
        verbose_name=_('Demandé par')
    )
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='refunds_processed',
        verbose_name=_('Traité par')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Terminé le'))
    
    class Meta:
        verbose_name = _('Remboursement')
        verbose_name_plural = _('Remboursements')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.refund_id} - {self.amount} {self.payment.currency}"
    
    def save(self, *args, **kwargs):
        # Generate refund ID
        if not self.refund_id:
            self.refund_id = f"RFD-{uuid.uuid4().hex[:12].upper()}"
        
        # Set completed timestamp
        if self.status == self.Status.COMPLETED and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
        
        super().save(*args, **kwargs)

