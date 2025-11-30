"""
Admin interface for Core models
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import ConsularOffice, ServiceType, Announcement, AuditLog, FAQ, Feedback, SiteSettings


@admin.register(ConsularOffice)
class ConsularOfficeAdmin(admin.ModelAdmin):
    """Consular Office Admin"""
    list_display = ['name', 'office_type', 'city', 'country', 'is_active', 'accepts_appointments']
    list_filter = ['office_type', 'is_active', 'accepts_appointments', 'city']
    search_fields = ['name', 'city', 'address_line1', 'email', 'phone_primary']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (_('Informations Générales'), {
            'fields': ('name', 'office_type', 'is_active', 'accepts_appointments')
        }),
        (_('Adresse'), {
            'fields': ('address_line1', 'address_line2', 'city', 'postal_code', 'country')
        }),
        (_('Coordonnées GPS'), {
            'fields': ('latitude', 'longitude'),
            'description': _('Pour affichage sur la carte')
        }),
        (_('Contact'), {
            'fields': ('phone_primary', 'phone_secondary', 'email', 'emergency_phone')
        }),
        (_('Détails'), {
            'fields': ('opening_hours', 'jurisdiction_countries')
        }),
        (_('Métadonnées'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ServiceType)
class ServiceTypeAdmin(admin.ModelAdmin):
    """Service Type Admin"""
    list_display = ['name', 'category', 'base_fee', 'processing_time_days', 'requires_appointment', 'is_active']
    list_filter = ['category', 'is_active', 'requires_appointment']
    search_fields = ['name', 'description']
    filter_horizontal = ['offices']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (_('Informations Générales'), {
            'fields': ('name', 'category', 'description', 'is_active')
        }),
        (_('Exigences'), {
            'fields': ('required_documents', 'requires_appointment')
        }),
        (_('Tarification et Délais'), {
            'fields': ('base_fee', 'processing_time_days')
        }),
        (_('Disponibilité'), {
            'fields': ('offices',)
        }),
        (_('Affichage'), {
            'fields': ('display_order',)
        }),
        (_('Métadonnées'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    """Announcement Admin"""
    list_display = ['title', 'priority', 'is_pinned', 'is_published', 'publish_from', 'publish_to', 'office']
    list_filter = ['priority', 'is_pinned', 'is_published', 'office', 'publish_from']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    date_hierarchy = 'publish_from'
    
    fieldsets = (
        (_('Contenu'), {
            'fields': ('title', 'content', 'priority')
        }),
        (_('Publication'), {
            'fields': ('is_published', 'is_pinned', 'publish_from', 'publish_to', 'office')
        }),
        (_('Ciblage'), {
            'fields': ('target_all_users', 'target_roles')
        }),
        (_('Métadonnées'), {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Audit Log Admin - Read Only"""
    list_display = ['timestamp', 'user', 'action', 'description', 'ip_address']
    list_filter = ['action', 'timestamp']
    search_fields = ['user__email', 'user__username', 'description', 'ip_address']
    readonly_fields = ['user', 'action', 'description', 'ip_address', 'user_agent', 
                       'content_type', 'object_id', 'metadata', 'timestamp']
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    """FAQ Admin"""
    list_display = ['question', 'category', 'display_order', 'is_published', 'updated_at']
    list_filter = ['category', 'is_published']
    search_fields = ['question', 'answer']
    list_editable = ['display_order', 'is_published']
    
    fieldsets = (
        (_('Contenu'), {
            'fields': ('category', 'question', 'answer')
        }),
        (_('Affichage'), {
            'fields': ('display_order', 'is_published')
        }),
    )


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    """Feedback Admin - User feedback management"""
    list_display = ['created_at', 'user_name', 'page', 'rating', 'is_resolved', 'has_comment']
    list_filter = ['rating', 'is_resolved', 'page', 'created_at']
    search_fields = ['user__email', 'page', 'comment', 'context']
    readonly_fields = ['user', 'page', 'context', 'rating', 'comment', 
                       'ip_address', 'user_agent', 'created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (_('Feedback'), {
            'fields': ('user', 'page', 'context', 'rating', 'comment')
        }),
        (_('Suivi'), {
            'fields': ('is_resolved', 'admin_notes')
        }),
        (_('Métadonnées'), {
            'fields': ('ip_address', 'user_agent', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_resolved']
    
    def user_name(self, obj):
        return obj.user.get_full_name() if obj.user else 'Anonyme'
    user_name.short_description = _('Utilisateur')
    
    def has_comment(self, obj):
        return bool(obj.comment)
    has_comment.boolean = True
    has_comment.short_description = _('Commentaire')
    
    @admin.action(description=_('Marquer comme traité'))
    def mark_as_resolved(self, request, queryset):
        updated = queryset.update(is_resolved=True)
        self.message_user(request, f'{updated} feedback(s) marqué(s) comme traité(s).')


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    """Site Settings Admin - Singleton"""
    list_display = ['__str__', 'registration_enabled', 'appointments_enabled', 
                    'applications_enabled', 'payments_enabled', 'site_maintenance_mode', 'updated_at']
    list_editable = ['registration_enabled', 'appointments_enabled', 
                     'applications_enabled', 'payments_enabled', 'site_maintenance_mode']
    
    fieldsets = (
        (_('Inscription'), {
            'fields': ('registration_enabled', 'registration_message'),
            'description': _('Contrôle l\'activation de l\'inscription des nouveaux utilisateurs')
        }),
        (_('Rendez-vous'), {
            'fields': ('appointments_enabled', 'appointments_message'),
            'description': _('Contrôle l\'activation de la prise de rendez-vous')
        }),
        (_('Demandes'), {
            'fields': ('applications_enabled', 'applications_message'),
            'description': _('Contrôle l\'activation de la soumission de demandes')
        }),
        (_('Paiements'), {
            'fields': ('payments_enabled', 'payments_message'),
            'description': _('Contrôle l\'activation des paiements en ligne')
        }),
        (_('Mode Maintenance'), {
            'fields': ('site_maintenance_mode', 'maintenance_message'),
            'description': _('Le mode maintenance désactive toutes les fonctionnalités publiques (sauf connexion admin)')
        }),
        (_('Métadonnées'), {
            'fields': ('updated_by', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['updated_at', 'updated_by']
    
    def has_add_permission(self, request):
        # Un seul objet SiteSettings
        return not SiteSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False  # Ne pas permettre la suppression
    
    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
    
    def changelist_view(self, request, extra_context=None):
        # Rediriger vers l'objet unique
        settings = SiteSettings.get_settings()
        return self.change_view(request, str(settings.id))

