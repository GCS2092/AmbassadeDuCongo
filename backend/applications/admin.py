"""
Admin interface for Applications
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Document, Application, VisaApplication, PassportApplication


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """Document Admin"""
    list_display = ['document_type', 'owner_name', 'original_filename', 'file_size_display', 
                    'is_verified', 'created_at']
    list_filter = ['document_type', 'is_verified', 'created_at']
    search_fields = ['owner__email', 'owner__first_name', 'owner__last_name', 'original_filename']
    readonly_fields = ['file_size', 'created_at', 'updated_at', 'verified_at']
    
    fieldsets = (
        (_('Document'), {
            'fields': ('owner', 'document_type', 'file', 'original_filename', 'file_size', 'description')
        }),
        (_('Vérification'), {
            'fields': ('is_verified', 'verified_by', 'verified_at', 'verification_notes')
        }),
        (_('Métadonnées'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_verified']
    
    def owner_name(self, obj):
        return obj.owner.get_full_name()
    owner_name.short_description = _('Propriétaire')
    
    def file_size_display(self, obj):
        """Display file size in human-readable format"""
        size_mb = obj.file_size / (1024 * 1024)
        if size_mb < 1:
            return f"{obj.file_size / 1024:.1f} KB"
        return f"{size_mb:.2f} MB"
    file_size_display.short_description = _('Taille')
    
    @admin.action(description=_('Marquer comme vérifié'))
    def mark_as_verified(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(
            is_verified=True,
            verified_by=request.user,
            verified_at=timezone.now()
        )
        self.message_user(request, f'{updated} document(s) vérifié(s).')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    """Application Admin with comprehensive management"""
    list_display = ['reference_number', 'applicant_name', 'application_type', 'status_badge', 
                    'total_fee', 'submitted_at', 'assigned_agent']
    list_filter = ['status', 'application_type', 'office', 'submitted_at']
    search_fields = ['reference_number', 'applicant__email', 'applicant__first_name', 'applicant__last_name']
    readonly_fields = ['reference_number', 'total_fee', 'submitted_at', 'completed_at', 
                       'created_at', 'updated_at']
    filter_horizontal = ['documents']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (_('Référence'), {
            'fields': ('reference_number',)
        }),
        (_('Informations de base'), {
            'fields': ('application_type', 'service_type', 'applicant', 'office')
        }),
        (_('Statut'), {
            'fields': ('status', 'assigned_agent')
        }),
        (_('Documents'), {
            'fields': ('documents',)
        }),
        (_('Frais'), {
            'fields': ('base_fee', 'additional_fees', 'total_fee')
        }),
        (_('Notes'), {
            'fields': ('applicant_notes', 'admin_notes', 'rejection_reason')
        }),
        (_('Métadonnées'), {
            'fields': ('submitted_at', 'completed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_under_review', 'mark_as_processing', 'mark_as_ready', 'mark_as_completed']
    
    def applicant_name(self, obj):
        return obj.applicant.get_full_name()
    applicant_name.short_description = _('Demandeur')
    
    def status_badge(self, obj):
        colors = {
            'DRAFT': 'gray',
            'SUBMITTED': 'blue',
            'UNDER_REVIEW': 'orange',
            'INFO_REQUIRED': 'yellow',
            'PAYMENT_PENDING': 'purple',
            'PAYMENT_RECEIVED': 'cyan',
            'PROCESSING': 'teal',
            'READY': 'lightgreen',
            'COMPLETED': 'green',
            'REJECTED': 'red',
            'CANCELLED': 'darkgray',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = _('Statut')
    
    @admin.action(description=_('Marquer en vérification'))
    def mark_as_under_review(self, request, queryset):
        updated = queryset.update(status='UNDER_REVIEW')
        self.message_user(request, f'{updated} demande(s) en vérification.')
    
    @admin.action(description=_('Marquer en traitement'))
    def mark_as_processing(self, request, queryset):
        updated = queryset.update(status='PROCESSING')
        self.message_user(request, f'{updated} demande(s) en traitement.')
    
    @admin.action(description=_('Marquer prêt'))
    def mark_as_ready(self, request, queryset):
        updated = queryset.update(status='READY')
        self.message_user(request, f'{updated} demande(s) prête(s).')
    
    @admin.action(description=_('Marquer terminé'))
    def mark_as_completed(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='COMPLETED', completed_at=timezone.now())
        self.message_user(request, f'{updated} demande(s) terminée(s).')


@admin.register(VisaApplication)
class VisaApplicationAdmin(admin.ModelAdmin):
    """Visa Application Details Admin"""
    list_display = ['application', 'visa_type', 'intended_entry_date', 'duration_days', 'destination_city']
    list_filter = ['visa_type', 'intended_entry_date']
    search_fields = ['application__reference_number', 'destination_city', 'sponsor_name']
    
    fieldsets = (
        (_('Demande'), {
            'fields': ('application', 'visa_type')
        }),
        (_('Voyage'), {
            'fields': ('purpose_of_visit', 'intended_entry_date', 'intended_departure_date', 
                       'duration_days', 'destination_city', 'accommodation_address')
        }),
        (_('Parrain/Contact'), {
            'fields': ('sponsor_name', 'sponsor_phone', 'sponsor_address')
        }),
        (_('Emploi'), {
            'fields': ('occupation', 'employer')
        }),
    )


@admin.register(PassportApplication)
class PassportApplicationAdmin(admin.ModelAdmin):
    """Passport Application Details Admin"""
    list_display = ['application', 'passport_type', 'current_passport_number', 'current_passport_expiry_date']
    list_filter = ['passport_type']
    search_fields = ['application__reference_number', 'current_passport_number']
    
    fieldsets = (
        (_('Demande'), {
            'fields': ('application', 'passport_type')
        }),
        (_('Passeport actuel'), {
            'fields': ('current_passport_number', 'current_passport_issue_date', 'current_passport_expiry_date')
        }),
        (_('Remplacement'), {
            'fields': ('replacement_reason',)
        }),
    )

