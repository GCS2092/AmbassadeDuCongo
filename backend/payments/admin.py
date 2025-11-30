"""
Admin interface for Payments
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Payment, Refund


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Payment Admin"""
    list_display = ['transaction_id', 'user_name', 'amount_display', 'payment_method', 
                    'status_badge', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['transaction_id', 'receipt_number', 'user__email', 
                     'application__reference_number', 'provider_transaction_id']
    readonly_fields = ['transaction_id', 'receipt_number', 'created_at', 'updated_at', 'completed_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (_('Transaction'), {
            'fields': ('transaction_id', 'receipt_number')
        }),
        (_('Informations'), {
            'fields': ('application', 'user', 'amount', 'currency')
        }),
        (_('Paiement'), {
            'fields': ('payment_method', 'status')
        }),
        (_('Fournisseur'), {
            'fields': ('provider_transaction_id', 'provider_reference', 'provider_response')
        }),
        (_('Reçu'), {
            'fields': ('receipt_url',)
        }),
        (_('Notes'), {
            'fields': ('description', 'admin_notes', 'failure_reason')
        }),
        (_('Métadonnées'), {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_completed', 'mark_as_failed']
    
    def user_name(self, obj):
        return obj.user.get_full_name()
    user_name.short_description = _('Utilisateur')
    
    def amount_display(self, obj):
        return f"{obj.amount} {obj.currency}"
    amount_display.short_description = _('Montant')
    
    def status_badge(self, obj):
        colors = {
            'PENDING': 'orange',
            'PROCESSING': 'blue',
            'COMPLETED': 'green',
            'FAILED': 'red',
            'CANCELLED': 'gray',
            'REFUNDED': 'purple',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = _('Statut')
    
    @admin.action(description=_('Marquer comme terminé'))
    def mark_as_completed(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='COMPLETED', completed_at=timezone.now())
        self.message_user(request, f'{updated} paiement(s) terminé(s).')
    
    @admin.action(description=_('Marquer comme échoué'))
    def mark_as_failed(self, request, queryset):
        updated = queryset.update(status='FAILED')
        self.message_user(request, f'{updated} paiement(s) échoué(s).')


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    """Refund Admin"""
    list_display = ['refund_id', 'payment_transaction', 'amount_display', 'status', 
                    'requested_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['refund_id', 'payment__transaction_id', 'reason']
    readonly_fields = ['refund_id', 'created_at', 'updated_at', 'completed_at']
    
    fieldsets = (
        (_('Remboursement'), {
            'fields': ('refund_id', 'payment', 'amount', 'status')
        }),
        (_('Motif'), {
            'fields': ('reason',)
        }),
        (_('Fournisseur'), {
            'fields': ('provider_refund_id',)
        }),
        (_('Personnel'), {
            'fields': ('requested_by', 'processed_by')
        }),
        (_('Métadonnées'), {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def payment_transaction(self, obj):
        return obj.payment.transaction_id
    payment_transaction.short_description = _('Transaction')
    
    def amount_display(self, obj):
        return f"{obj.amount} {obj.payment.currency}"
    amount_display.short_description = _('Montant')

