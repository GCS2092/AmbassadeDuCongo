"""
Admin interface for User management
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Profile, EmailVerificationCode, UserDocument, DocumentReminder


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin with role management"""
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'is_verified', 'is_active', 'date_joined']
    list_filter = ['role', 'is_verified', 'is_active', 'is_2fa_enabled', 'date_joined']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        (_('Informations Consulaires'), {
            'fields': ('role', 'phone_number', 'is_verified', 'is_2fa_enabled')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (_('Informations Supplémentaires'), {
            'fields': ('email', 'role', 'phone_number')
        }),
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """Profile Admin"""
    list_display = ['user', 'nationality', 'consular_number', 'passport_number', 'documents_complete', 'updated_at']
    list_filter = ['nationality', 'documents_complete', 'gender']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'consular_number', 'passport_number']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (_('Utilisateur'), {
            'fields': ('user',)
        }),
        (_('Informations Personnelles'), {
            'fields': ('date_of_birth', 'place_of_birth', 'gender', 'nationality', 'photo')
        }),
        (_('Informations Consulaires'), {
            'fields': ('consular_number', 'passport_number', 'passport_expiry', 'documents_complete')
        }),
        (_('Adresse'), {
            'fields': ('address_line1', 'address_line2', 'city', 'postal_code', 'country')
        }),
        (_('Contact d\'urgence'), {
            'fields': ('emergency_contact_name', 'emergency_contact_phone')
        }),
        (_('Métadonnées'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    """Email Verification Code Admin"""
    list_display = ['user', 'email', 'code', 'created_at', 'expires_at', 'is_used']
    list_filter = ['is_used', 'created_at', 'expires_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'code']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(UserDocument)
class UserDocumentAdmin(admin.ModelAdmin):
    """User Document Admin"""
    list_display = ['name', 'user', 'document_type', 'upload_date', 'expiry_date', 'status', 'is_verified']
    list_filter = ['document_type', 'is_verified', 'upload_date', 'expiry_date']
    search_fields = ['name', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['upload_date', 'status']
    ordering = ['-upload_date']
    
    def status(self, obj):
        return obj.status
    status.short_description = 'Statut'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(DocumentReminder)
class DocumentReminderAdmin(admin.ModelAdmin):
    """Document Reminder Admin"""
    list_display = ['document', 'user', 'expiry_date', 'days_until_expiry', 'priority', 'status', 'email_sent']
    list_filter = ['priority', 'status', 'email_sent', 'expiry_date']
    search_fields = ['document__name', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['expiry_date', '-priority']
    date_hierarchy = 'expiry_date'
    
    fieldsets = (
        (_('Document'), {
            'fields': ('document', 'user')
        }),
        (_('Informations de rappel'), {
            'fields': ('expiry_date', 'days_until_expiry', 'priority', 'status')
        }),
        (_('Notifications'), {
            'fields': ('email_sent', 'email_sent_at', 'notification_sent')
        }),
        (_('Suivi'), {
            'fields': ('notes', 'handled_at')
        }),
        (_('Métadonnées'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('document', 'user')

