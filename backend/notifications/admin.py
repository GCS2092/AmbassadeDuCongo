"""
Admin interface for Notifications
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import NotificationTemplate, Notification, PushDevice


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    """Notification Template Admin"""
    list_display = ['notification_type', 'send_email', 'send_sms', 'send_push', 'is_active']
    list_filter = ['send_email', 'send_sms', 'send_push', 'is_active']
    search_fields = ['notification_type', 'email_subject', 'push_title']
    
    fieldsets = (
        (_('Type'), {
            'fields': ('notification_type', 'is_active')
        }),
        (_('Email'), {
            'fields': ('send_email', 'email_subject', 'email_body', 'email_html_body')
        }),
        (_('SMS'), {
            'fields': ('send_sms', 'sms_body')
        }),
        (_('Push'), {
            'fields': ('send_push', 'push_title', 'push_body')
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Notification Admin"""
    list_display = ['title', 'recipient_name', 'channel', 'status_badge', 'created_at', 'sent_at']
    list_filter = ['channel', 'status', 'created_at']
    search_fields = ['title', 'message', 'recipient__email', 'recipient__first_name', 'recipient__last_name']
    readonly_fields = ['created_at', 'sent_at', 'read_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (_('Destinataire'), {
            'fields': ('recipient', 'channel')
        }),
        (_('Contenu'), {
            'fields': ('title', 'message', 'notification_type')
        }),
        (_('Statut'), {
            'fields': ('status', 'error_message')
        }),
        (_('Relation'), {
            'fields': ('related_object_type', 'related_object_id')
        }),
        (_('Métadonnées'), {
            'fields': ('created_at', 'sent_at', 'read_at', 'provider_response'),
            'classes': ('collapse',)
        }),
    )
    
    def recipient_name(self, obj):
        return obj.recipient.get_full_name()
    recipient_name.short_description = _('Destinataire')
    
    def status_badge(self, obj):
        colors = {
            'PENDING': 'orange',
            'SENT': 'blue',
            'DELIVERED': 'green',
            'FAILED': 'red',
            'READ': 'purple',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = _('Statut')


@admin.register(PushDevice)
class PushDeviceAdmin(admin.ModelAdmin):
    """Push Device Admin"""
    list_display = ['user_name', 'device_name', 'device_type', 'is_active', 'last_used']
    list_filter = ['is_active', 'device_type', 'last_used']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'device_name', 'token']
    readonly_fields = ['created_at', 'updated_at', 'last_used']
    
    def user_name(self, obj):
        return obj.user.get_full_name()
    user_name.short_description = _('Utilisateur')

