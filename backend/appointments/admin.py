"""
Admin interface for Appointments
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Appointment, AppointmentSlot


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Appointment Admin with comprehensive management"""
    list_display = ['reference_number', 'user_name', 'service_type', 'appointment_date', 
                    'appointment_time', 'status_badge', 'office']
    list_filter = ['status', 'appointment_date', 'office', 'service_type']
    search_fields = ['reference_number', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['reference_number', 'qr_code_display', 'created_at', 'updated_at', 
                       'confirmed_at', 'completed_at']
    date_hierarchy = 'appointment_date'
    
    fieldsets = (
        (_('Référence'), {
            'fields': ('reference_number', 'qr_code_display')
        }),
        (_('Informations de rendez-vous'), {
            'fields': ('user', 'office', 'service_type')
        }),
        (_('Planification'), {
            'fields': ('appointment_date', 'appointment_time', 'duration_minutes')
        }),
        (_('Statut'), {
            'fields': ('status', 'assigned_agent')
        }),
        (_('Notes'), {
            'fields': ('user_notes', 'admin_notes')
        }),
        (_('Communication'), {
            'fields': ('confirmation_sent', 'reminder_sent')
        }),
        (_('Métadonnées'), {
            'fields': ('created_at', 'updated_at', 'confirmed_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_confirmed', 'mark_as_completed', 'mark_as_cancelled']
    
    def user_name(self, obj):
        return obj.user.get_full_name()
    user_name.short_description = _('Utilisateur')
    
    def status_badge(self, obj):
        colors = {
            'PENDING': 'orange',
            'CONFIRMED': 'blue',
            'CHECKED_IN': 'purple',
            'IN_PROGRESS': 'teal',
            'COMPLETED': 'green',
            'CANCELLED': 'red',
            'NO_SHOW': 'gray',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = _('Statut')
    
    def qr_code_display(self, obj):
        if obj.qr_code:
            return format_html('<img src="{}" width="200" height="200" />', obj.qr_code.url)
        return '-'
    qr_code_display.short_description = _('QR Code')
    
    @admin.action(description=_('Marquer comme confirmé'))
    def mark_as_confirmed(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='CONFIRMED', confirmed_at=timezone.now())
        self.message_user(request, f'{updated} rendez-vous confirmé(s).')
    
    @admin.action(description=_('Marquer comme terminé'))
    def mark_as_completed(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='COMPLETED', completed_at=timezone.now())
        self.message_user(request, f'{updated} rendez-vous terminé(s).')
    
    @admin.action(description=_('Annuler'))
    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status='CANCELLED')
        self.message_user(request, f'{updated} rendez-vous annulé(s).')


@admin.register(AppointmentSlot)
class AppointmentSlotAdmin(admin.ModelAdmin):
    """Appointment Slot Admin for managing availability"""
    list_display = ['date', 'start_time', 'end_time', 'office', 'service_type', 
                    'appointments_count', 'max_appointments', 'is_available']
    list_filter = ['is_available', 'date', 'office', 'service_type']
    search_fields = ['office__name', 'service_type__name']
    date_hierarchy = 'date'
    
    fieldsets = (
        (_('Localisation'), {
            'fields': ('office', 'service_type')
        }),
        (_('Horaire'), {
            'fields': ('date', 'start_time', 'end_time')
        }),
        (_('Capacité'), {
            'fields': ('max_appointments', 'is_available')
        }),
    )

