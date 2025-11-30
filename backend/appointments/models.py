"""
Appointment models for scheduling consular services
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import FileExtensionValidator
from core.models import ConsularOffice, ServiceType
import qrcode
from io import BytesIO
from django.core.files import File
from django.utils import timezone
import uuid


class Appointment(models.Model):
    """
    Represents a scheduled appointment at a consular office
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('En attente')
        CONFIRMED = 'CONFIRMED', _('Confirmé')
        CHECKED_IN = 'CHECKED_IN', _('Enregistré')
        IN_PROGRESS = 'IN_PROGRESS', _('En cours')
        COMPLETED = 'COMPLETED', _('Terminé')
        CANCELLED = 'CANCELLED', _('Annulé')
        NO_SHOW = 'NO_SHOW', _('Absent')
    
    # Unique reference number
    reference_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        verbose_name=_('Numéro de référence')
    )
    
    # Relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name=_('Utilisateur')
    )
    office = models.ForeignKey(
        ConsularOffice,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name=_('Bureau consulaire')
    )
    service_type = models.ForeignKey(
        ServiceType,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name=_('Type de service')
    )
    
    # Scheduling
    appointment_date = models.DateField(verbose_name=_('Date du rendez-vous'))
    appointment_time = models.TimeField(verbose_name=_('Heure du rendez-vous'))
    duration_minutes = models.IntegerField(
        default=30,
        verbose_name=_('Durée (minutes)')
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name=_('Statut')
    )
    
    # QR Code for check-in
    qr_code = models.ImageField(
        upload_to='qrcodes/',
        blank=True,
        null=True,
        verbose_name=_('QR Code')
    )
    
    # Notes and Communication
    user_notes = models.TextField(
        blank=True,
        verbose_name=_('Notes de l\'utilisateur')
    )
    admin_notes = models.TextField(
        blank=True,
        verbose_name=_('Notes administratives')
    )
    
    # Assignment
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_appointments',
        verbose_name=_('Agent assigné')
    )
    
    # Confirmation
    confirmation_sent = models.BooleanField(default=False, verbose_name=_('Confirmation envoyée'))
    reminder_sent = models.BooleanField(default=False, verbose_name=_('Rappel envoyé'))
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Confirmé le'))
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Terminé le'))
    
    class Meta:
        verbose_name = _('Rendez-vous')
        verbose_name_plural = _('Rendez-vous')
        ordering = ['-appointment_date', '-appointment_time']
        indexes = [
            models.Index(fields=['appointment_date', 'appointment_time']),
            models.Index(fields=['user', '-appointment_date']),
            models.Index(fields=['status', 'appointment_date']),
        ]
    
    def __str__(self):
        return f"{self.reference_number} - {self.user.get_full_name()} - {self.appointment_date}"
    
    def save(self, *args, **kwargs):
        # Generate reference number if new
        if not self.reference_number:
            self.reference_number = self.generate_reference_number()
        
        # Generate QR code if new or reference changed
        if not self.qr_code or not self.pk:
            self.generate_qr_code()
        
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_reference_number():
        """Generate a unique reference number"""
        return f"APT-{uuid.uuid4().hex[:8].upper()}"
    
    def generate_qr_code(self):
        """Generate QR code for appointment with complete information"""
        import json
        from datetime import datetime, timedelta
        
        # Create appointment data in JSON format
        appointment_data = {
            "type": "APPOINTMENT",
            "reference": self.reference_number,
            "appointment": {
                "id": str(self.id),
                "reference": self.reference_number,
                "date": self.appointment_date.strftime("%Y-%m-%d"),
                "time": self.appointment_time.strftime("%H:%M"),
                "duration": self.duration_minutes,
                "status": self.status,
                "service": {
                    "id": self.service_type.id,
                    "name": self.service_type.name,
                    "description": self.service_type.description
                },
                "office": {
                    "id": self.office.id,
                    "name": self.office.name,
                    "address": self.office.full_address
                },
                "user": {
                    "id": str(self.user.id),
                    "name": self.user.get_full_name(),
                    "email": self.user.email,
                    "role": self.user.role
                }
            },
            "embassy": {
                "name": "Ambassade de la République du Congo - Sénégal",
                "address": "Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal",
                "phone": "+221 824 8398",
                "email": "contact@ambassade-congo.sn"
            },
            "generatedAt": datetime.now().isoformat() + "Z",
            "validUntil": (self.appointment_date + timedelta(days=1)).isoformat() + "Z",
            "purpose": "Identification rendez-vous - Accès aux services consulaires"
        }
        
        qr = qrcode.QRCode(version=1, box_size=8, border=5)
        qr.add_data(json.dumps(appointment_data, ensure_ascii=False))
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        filename = f'qr_{self.reference_number}.png'
        self.qr_code.save(filename, File(buffer), save=False)
    
    @property
    def can_be_cancelled(self):
        """Check if appointment can be cancelled"""
        return self.status in [self.Status.PENDING, self.Status.CONFIRMED]


class CheckInLog(models.Model):
    """Log des scans/check-in effectués par les vigiles"""
    appointment = models.ForeignKey(
        'appointments.Appointment', on_delete=models.CASCADE, related_name='checkin_logs'
    )
    scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='performed_checkins'
    )
    scanned_at = models.DateTimeField(default=timezone.now)
    reference_number = models.CharField(max_length=20)
    status_after = models.CharField(max_length=20)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['reference_number', '-scanned_at']),
            models.Index(fields=['scanned_at']),
        ]

class AppointmentSlot(models.Model):
    """
    Available time slots for appointments
    Allows staff to manage appointment availability
    """
    office = models.ForeignKey(
        ConsularOffice,
        on_delete=models.CASCADE,
        related_name='appointment_slots',
        verbose_name=_('Bureau consulaire')
    )
    service_type = models.ForeignKey(
        ServiceType,
        on_delete=models.CASCADE,
        related_name='appointment_slots',
        verbose_name=_('Type de service')
    )
    
    date = models.DateField(verbose_name=_('Date'))
    start_time = models.TimeField(verbose_name=_('Heure de début'))
    end_time = models.TimeField(verbose_name=_('Heure de fin'))
    
    max_appointments = models.IntegerField(
        default=1,
        verbose_name=_('Nombre maximum de rendez-vous')
    )
    is_available = models.BooleanField(default=True, verbose_name=_('Disponible'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Créneau de rendez-vous')
        verbose_name_plural = _('Créneaux de rendez-vous')
        ordering = ['date', 'start_time']
        unique_together = ['office', 'service_type', 'date', 'start_time']
    
    def __str__(self):
        return f"{self.office.name} - {self.date} {self.start_time}"
    
    @property
    def appointments_count(self):
        """Count confirmed appointments for this slot"""
        from django.db.models import Q
        return Appointment.objects.filter(
            office=self.office,
            service_type=self.service_type,
            appointment_date=self.date,
            appointment_time=self.start_time,
            status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED]
        ).count()
    
    @property
    def is_full(self):
        """Check if slot is fully booked"""
        return self.appointments_count >= self.max_appointments

