"""
API views for Appointments
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import Appointment, AppointmentSlot, CheckInLog
from .serializers import (
    AppointmentSerializer, AppointmentCreateSerializer, AppointmentSlotSerializer
)
from core.models import AuditLog, SiteSettings
from core.permissions import IsAgent, IsVigile
from django.contrib.contenttypes.models import ContentType
from django.core.mail import send_mail
from django.conf import settings

# Notifications
from notifications.tasks import notify_appointment_status_changed, send_appointment_reminder


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing appointments
    Users can only view/manage their own appointments
    """
    permission_classes = (IsAuthenticated,)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'office', 'service_type', 'appointment_date', 'reference_number']
    ordering = ['-appointment_date', '-appointment_time']
    
    def get_queryset(self):
        """Return user's appointments or all if staff"""
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE']:
            return Appointment.objects.all()
        return Appointment.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def create(self, request, *args, **kwargs):
        """Restrict creation to citizens and appointment/consular agents"""
        # Vérifier si les rendez-vous sont activés
        site_settings = SiteSettings.get_settings()
        
        if not site_settings.appointments_enabled:
            return Response(
                {
                    "error": "La prise de rendez-vous est actuellement désactivée.",
                    "message": site_settings.appointments_message,
                    "appointments_disabled": True
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier le mode maintenance
        if site_settings.site_maintenance_mode:
            return Response(
                {
                    "error": "Le site est actuellement en maintenance.",
                    "message": site_settings.maintenance_message,
                    "maintenance_mode": True
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        allowed_roles = ['CITIZEN', 'AGENT_RDV', 'AGENT_CONSULAIRE']
        if getattr(request.user, 'role', None) not in allowed_roles:
            return Response(
                {"error": "Création de rendez-vous non autorisée pour ce rôle."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Create appointment and log action"""
        appointment = serializer.save()
        
        # Log creation
        AuditLog.objects.create(
            user=self.request.user,
            action='CREATE',
            description=f"Rendez-vous créé: {appointment.reference_number}",
            content_type=ContentType.objects.get_for_model(Appointment),
            object_id=appointment.id
        )
        
        # Create in-app notification
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=appointment.user,
                channel=Notification.Channel.IN_APP,
                title='Rendez-vous créé',
                message=f'Votre rendez-vous {appointment.reference_number} pour {appointment.service_type.name} le {appointment.appointment_date} à {appointment.appointment_time} a été créé avec succès.',
                notification_type='APPOINTMENT_CREATED',
                related_object_type='appointment',
                related_object_id=str(appointment.id),
                status=Notification.Status.SENT
            )
        except Exception as e:
            import logging
            logger = logging.getLogger('embassy')
            logger.error(f"Failed to create appointment notification: {e}")
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an appointment"""
        appointment = self.get_object()
        
        if not appointment.can_be_cancelled:
            return Response(
                {"error": "Ce rendez-vous ne peut pas être annulé."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.status = 'CANCELLED'
        appointment.save()
        
        # Log cancellation
        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            description=f"Rendez-vous annulé: {appointment.reference_number}",
            content_type=ContentType.objects.get_for_model(Appointment),
            object_id=appointment.id
        )

        # Create in-app notification
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=appointment.user,
                channel=Notification.Channel.IN_APP,
                title='Rendez-vous annulé',
                message=f'Votre rendez-vous {appointment.reference_number} a été annulé.',
                notification_type='APPOINTMENT_CANCELLED',
                related_object_type='appointment',
                related_object_id=str(appointment.id),
                status=Notification.Status.SENT
            )
        except Exception as e:
            import logging
            logger = logging.getLogger('embassy')
            logger.error(f"Failed to create appointment cancellation notification: {e}")
        
        return Response({"status": "Rendez-vous annulé avec succès."})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAgent])
    def update_status(self, request, pk=None):
        """Admin/Agent: Update appointment status and notify user"""
        appointment = self.get_object()
        new_status = request.data.get('status')

        valid_statuses = [choice[0] for choice in Appointment.Status.choices]
        if new_status not in valid_statuses:
            return Response(
                {"error": "Statut invalide."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update timestamps depending on status
        from django.utils import timezone as dj_timezone

        appointment.status = new_status
        if new_status == 'CONFIRMED':
            appointment.confirmed_at = dj_timezone.now()
        if new_status == 'COMPLETED':
            appointment.completed_at = dj_timezone.now()
        appointment.save()

        # Log
        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            description=f"Statut RDV {appointment.reference_number} -> {new_status}",
            content_type=ContentType.objects.get_for_model(Appointment),
            object_id=appointment.id
        )

        # Notify asynchronously
        try:
            notify_appointment_status_changed(appointment.id)
        except Exception:
            # Notification failures should not block the response
            pass

        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAgent])
    def send_reminder(self, request, pk=None):
        """Agent: Send appointment reminder (email/SMS if configured)"""
        appointment = self.get_object()
        try:
            # Trigger async reminder task
            send_appointment_reminder(appointment.id)
        except Exception:
            return Response({"error": "Impossible d'envoyer le rappel pour le moment."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        AuditLog.objects.create(
            user=request.user,
            action='NOTIFY',
            description=f"Rappel RDV envoyé: {appointment.reference_number}",
            content_type=ContentType.objects.get_for_model(Appointment),
            object_id=appointment.id
        )
        return Response({"status": "Rappel envoyé."})
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get user's upcoming appointments"""
        today = timezone.now().date()
        appointments = self.get_queryset().filter(
            appointment_date__gte=today,
            status__in=['PENDING', 'CONFIRMED']
        ).order_by('appointment_date', 'appointment_time')
        
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get user's past appointments"""
        today = timezone.now().date()
        appointments = self.get_queryset().filter(
            appointment_date__lt=today
        ).order_by('-appointment_date', '-appointment_time')
        
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)


class AppointmentSlotViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing available appointment slots
    """
    queryset = AppointmentSlot.objects.filter(is_available=True)
    serializer_class = AppointmentSlotSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['office', 'service_type', 'date']
    ordering = ['date', 'start_time']
    
    def get_queryset(self):
        """Return only future available slots"""
        today = timezone.now().date()
        return super().get_queryset().filter(
            date__gte=today
        )
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available slots for a specific date range"""
        office_id = request.query_params.get('office')
        service_id = request.query_params.get('service')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not all([office_id, service_id, start_date]):
            return Response(
                {"error": "Les paramètres office, service et start_date sont requis."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(
            office_id=office_id,
            service_type_id=service_id,
            date__gte=start_date
        )
        
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter out full slots
        available_slots = [slot for slot in queryset if not slot.is_full]
        
        serializer = self.get_serializer(available_slots, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsVigile])
    def today(self, request):
        """Vigile: List today's appointments for check-in"""
        today = timezone.now().date()
        qs = Appointment.objects.filter(appointment_date=today).order_by('appointment_time')

        # Optional filter by office
        office_id = request.query_params.get('office')
        if office_id:
            qs = qs.filter(office_id=office_id)

        serializer = AppointmentSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsVigile])
    def check_in_by_qr(self, request):
        """Vigile: Check-in an appointment by reference_number from QR scan"""
        reference_number = request.data.get('reference_number')
        if not reference_number:
            return Response({"error": "reference_number requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            appointment = Appointment.objects.get(reference_number=reference_number)
        except Appointment.DoesNotExist:
            return Response({"error": "Rendez-vous introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Only allow check-in for appropriate statuses
        if appointment.status not in ['PENDING', 'CONFIRMED']:
            return Response({"error": "Ce rendez-vous ne peut pas être enregistré."}, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = 'CHECKED_IN'
        appointment.save()

        # Log the scan/check-in
        CheckInLog.objects.create(
            appointment=appointment,
            scanned_by=request.user,
            reference_number=appointment.reference_number,
            status_after=appointment.status,
            notes='QR check-in'
        )

        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            description=f"Check-in RDV {appointment.reference_number}",
            content_type=ContentType.objects.get_for_model(Appointment),
            object_id=appointment.id
        )

        serializer = AppointmentSerializer(appointment, context={'request': request})
        return Response({
            'appointment': serializer.data,
            'user': {
                'id': appointment.user.id,
                'name': appointment.user.get_full_name(),
                'email': appointment.user.email,
                'role': appointment.user.role,
            },
            'office': {
                'id': appointment.office.id,
                'name': appointment.office.name,
                'address': getattr(appointment.office, 'full_address', ''),
            }
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsVigile])
    def today_scans(self, request):
        """Vigile: List today's scanned appointments with details"""
        today = timezone.now().date()
        results = []
        try:
            logs = CheckInLog.objects.filter(scanned_at__date=today).select_related('appointment', 'scanned_by')
            for log in logs:
                appt = log.appointment
                results.append({
                    'reference_number': log.reference_number,
                    'scanned_at': log.scanned_at,
                    'status_after': log.status_after,
                    'scanned_by': getattr(log.scanned_by, 'email', None),
                    'appointment': {
                        'id': appt.id,
                        'service_name': appt.service_type.name,
                        'office_name': appt.office.name,
                        'appointment_date': appt.appointment_date,
                        'appointment_time': appt.appointment_time,
                        'status': appt.status,
                        'user_name': appt.user.get_full_name(),
                        'user_email': appt.user.email,
                    }
                })
        except Exception:
            # Fallback si la table de logs n'existe pas encore (migration non appliquée)
            fallback = Appointment.objects.filter(
                appointment_date=today,
                status='CHECKED_IN'
            ).select_related('user', 'office', 'service_type')
            for appt in fallback:
                results.append({
                    'reference_number': appt.reference_number,
                    'scanned_at': None,
                    'status_after': appt.status,
                    'scanned_by': None,
                    'appointment': {
                        'id': appt.id,
                        'service_name': appt.service_type.name,
                        'office_name': appt.office.name,
                        'appointment_date': appt.appointment_date,
                        'appointment_time': appt.appointment_time,
                        'status': appt.status,
                        'user_name': appt.user.get_full_name(),
                        'user_email': appt.user.email,
                    }
                })
        return Response(results)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsVigile])
    def complete_by_vigile(self, request, pk=None):
        """Vigile: marquer un rendez-vous comme terminé et notifier"""
        appointment = self.get_object()
        from django.utils import timezone as dj_timezone

        appointment.status = 'COMPLETED'
        appointment.completed_at = dj_timezone.now()
        appointment.save()

        CheckInLog.objects.create(
            appointment=appointment,
            scanned_by=request.user,
            reference_number=appointment.reference_number,
            status_after=appointment.status,
            notes='Completed by vigile'
        )

        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            description=f"RDV terminé (vigile): {appointment.reference_number}",
            content_type=ContentType.objects.get_for_model(Appointment),
            object_id=appointment.id
        )

        # Notifier l'usager (email/push)
        try:
            notify_appointment_status_changed(appointment.id)
        except Exception:
            pass

        # Notifier l'admin par email si possible
        try:
            admin_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
            if admin_email:
                send_mail(
                    subject=f"RDV terminé: {appointment.reference_number}",
                    message=(
                        f"Le rendez-vous {appointment.reference_number} a été marqué comme terminé par le vigile.\n"
                        f"Usager: {appointment.user.get_full_name()} ({appointment.user.email})\n"
                        f"Service: {appointment.service_type.name} - Bureau: {appointment.office.name}\n"
                        f"Date: {appointment.appointment_date} {appointment.appointment_time}"
                    ),
                    from_email=admin_email,
                    recipient_list=[admin_email],
                    fail_silently=True,
                )
        except Exception:
            pass

        return Response({"status": "RDV marqué comme terminé."})


# Import ContentType for audit logging

