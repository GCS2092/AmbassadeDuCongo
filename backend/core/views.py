"""
API views for Core models with export functionality
"""
from rest_framework import viewsets, filters, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import HttpResponse
from django.db import models
from django.contrib.auth import get_user_model

from .models import ConsularOffice, ServiceType, Announcement, FAQ, AuditLog, SiteSettings
from appointments.models import Appointment
from .serializers import (
    ConsularOfficeSerializer, ServiceTypeSerializer, 
    ServiceTypeListSerializer, ServiceTypeCreateUpdateSerializer,
    AnnouncementSerializer, FAQSerializer, AuditLogSerializer, SiteSettingsSerializer
)
from .permissions import IsAdmin, IsVigile
from .utils.exports import export_appointments_csv, export_applications_excel, export_payments_excel

User = get_user_model()


class ConsularOfficeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Consular Offices
    Admin access for write operations, public for read
    """
    queryset = ConsularOffice.objects.all()
    serializer_class = ConsularOfficeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['office_type', 'city', 'country', 'is_active']
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsAdmin]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter queryset based on user permissions
        """
        if self.action in ['list', 'retrieve']:
            # Public users only see active offices
            return ConsularOffice.objects.filter(is_active=True)
        else:
            # Admin users see all offices
            return ConsularOffice.objects.all()
    
    search_fields = ['name', 'city', 'address_line1']
    
    @action(detail=True, methods=['get'])
    def services(self, request, pk=None):
        """Get all services available at this office"""
        office = self.get_object()
        services = office.services.filter(is_active=True)
        serializer = ServiceTypeListSerializer(services, many=True)
        return Response(serializer.data)


class ServiceTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing service types
    Admin access for write operations, public for read
    """
    queryset = ServiceType.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'requires_appointment', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['display_order', 'name', 'base_fee']
    ordering = ['display_order', 'category']
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsAdmin]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter queryset based on user permissions
        """
        # Pour simplifier, tous les utilisateurs voient tous les services
        return ServiceType.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ServiceTypeListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ServiceTypeCreateUpdateSerializer
        return ServiceTypeSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for announcements
    Public read access, Admin write access
    """
    serializer_class = AnnouncementSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['priority', 'is_published', 'is_pinned', 'office']
    search_fields = ['title', 'content']
    ordering_fields = ['priority', 'publish_from', 'created_at']
    ordering = ['-is_pinned', '-priority', '-publish_from']
    
    def get_permissions(self):
        """
        Public read access, Admin write access
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsAdmin]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter queryset based on user permissions and publication status
        """
        queryset = Announcement.objects.all()
        
        # Admin users see all announcements (no filtering)
        if self.request.user and self.request.user.is_authenticated:
            if self.request.user.is_staff or self.request.user.role in ['ADMIN', 'SUPERADMIN']:
                return queryset
        
        # Public users (authenticated or not) only see published announcements within validity period
        if self.action in ['list', 'retrieve']:
            now = timezone.now()
            queryset = queryset.filter(
                is_published=True,
                publish_from__lte=now
            ).filter(
                models.Q(publish_to__isnull=True) | models.Q(publish_to__gte=now)
            )
            
            # Filter by target roles if user is authenticated
            if self.request.user and self.request.user.is_authenticated:
                user_role = getattr(self.request.user, 'role', None)
                if user_role:
                    # User is authenticated, filter by role targeting
                    queryset = queryset.filter(
                        models.Q(target_all_users=True) | models.Q(target_roles__icontains=user_role)
                    )
            else:
                # Anonymous users only see announcements targeted to all users
                queryset = queryset.filter(target_all_users=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)


class FAQViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for FAQ items
    """
    queryset = FAQ.objects.all()  # Supprimons le filtre is_active pour l'instant
    serializer_class = FAQSerializer
    permission_classes = (AllowAny,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['question', 'answer']
    ordering = ['category', 'display_order']


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing audit logs
    Admin only - read only
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = (IsAuthenticated, IsAdmin)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'user']
    search_fields = ['description', 'user__email', 'user__first_name', 'user__last_name', 'ip_address']
    ordering = ['-timestamp']
    ordering_fields = ['timestamp', 'action']


class AdminExportViewSet(viewsets.ViewSet):
    """
    Admin-only endpoints for exporting data (GRATUIT - CSV/Excel)
    """
    permission_classes = (IsAuthenticated,)
    
    @action(detail=False, methods=['get'])
    def appointments_csv(self, request):
        """Export appointments to CSV"""
        try:
            response = export_appointments_csv(request)
            return response
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'export: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def applications_excel(self, request):
        """Export applications to Excel"""
        try:
            response = export_applications_excel(request)
            return response
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'export: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def payments_excel(self, request):
        """Export payments to Excel"""
        try:
            response = export_payments_excel(request)
            return response
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'export: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get general statistics for dashboard"""
        # Vérifier le rôle admin
        if not request.user or request.user.role not in ['ADMIN', 'SUPERADMIN']:
            return Response({'error': 'Accès non autorisé'}, status=403)
            
        from appointments.models import Appointment
        from applications.models import Application
        from payments.models import Payment
        from django.db.models import Count, Sum, Q
        from datetime import datetime, timedelta
        
        # Date ranges
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        this_year_start = today.replace(month=1, day=1)
        
        stats = {
            'appointments': {
                'total': Appointment.objects.count(),
                'pending': Appointment.objects.filter(status='PENDING').count(),
                'confirmed': Appointment.objects.filter(status='CONFIRMED').count(),
                'today': Appointment.objects.filter(appointment_date=today).count(),
                'this_month': Appointment.objects.filter(created_at__gte=this_month_start).count(),
            },
            'applications': {
                'total': Application.objects.count(),
                'submitted': Application.objects.filter(status='SUBMITTED').count(),
                'under_review': Application.objects.filter(status='UNDER_REVIEW').count(),
                'processing': Application.objects.filter(status='PROCESSING').count(),
                'ready': Application.objects.filter(status='READY').count(),
                'this_month': Application.objects.filter(created_at__gte=this_month_start).count(),
            },
            'payments': {
                'total': Payment.objects.count(),
                'pending': Payment.objects.filter(status='PENDING').count(),
                'completed': Payment.objects.filter(status='COMPLETED').count(),
                'total_amount': Payment.objects.filter(status='COMPLETED').aggregate(
                    total=Sum('amount')
                )['total'] or 0,
                'this_month': Payment.objects.filter(created_at__gte=this_month_start).count(),
            },
            'users': {
                'total': User.objects.count(),
                'active': User.objects.filter(is_active=True).count(),
                'verified': User.objects.filter(is_verified=True).count(),
                'this_month': User.objects.filter(date_joined__gte=this_month_start).count(),
            }
        }
        
        return Response(stats)


class VigileStatisticsViewSet(viewsets.ViewSet):
    """
    Vigile-only endpoints for security statistics
    """
    permission_classes = (IsAuthenticated,)
    
    @action(detail=False, methods=['get'])
    def security_stats(self, request):
        """Get security statistics for vigile dashboard"""
        # Vérifier le rôle vigile
        if not request.user or request.user.role not in ['VIGILE', 'ADMIN', 'SUPERADMIN']:
            return Response({'error': 'Accès non autorisé'}, status=403)
            
        from appointments.models import Appointment
        from applications.models import Application
        from django.db.models import Count
        from datetime import datetime, timedelta
        
        # Date ranges
        today = timezone.now().date()
        this_week_start = today - timedelta(days=7)
        
        stats = {
            'today_access': {
                'total_appointments': Appointment.objects.filter(appointment_date=today).count(),
                'total_visitors': Appointment.objects.filter(appointment_date=today).values('user').distinct().count(),
                'pending_appointments': Appointment.objects.filter(
                    appointment_date=today, 
                    status='PENDING'
                ).count(),
            },
            'this_week': {
                'total_appointments': Appointment.objects.filter(
                    appointment_date__gte=this_week_start
                ).count(),
                'total_visitors': Appointment.objects.filter(
                    appointment_date__gte=this_week_start
                ).values('user').distinct().count(),
            },
            'recent_appointments': Appointment.objects.filter(
                appointment_date=today
            ).select_related('user', 'service_type').order_by('-appointment_time')[:10]
        }


class QRCodeScanViewSet(viewsets.ViewSet):
    """ViewSet pour le scan de QR codes par les vigiles"""
    permission_classes = [IsAuthenticated, IsVigile]
    
    @action(detail=False, methods=['post'])
    def scan_qr_code(self, request):
        """Scanner un QR code et retourner les informations"""
        try:
            qr_data = request.data.get('qr_data')
            if not qr_data:
                return Response({
                    'error': 'Données QR code manquantes'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Essayer de parser les données QR (format JSON ou texte)
            import json
            qr_info = None
            
            try:
                qr_info = json.loads(qr_data)
                print(f"QR code JSON valide: {qr_info}")
            except json.JSONDecodeError:
                # Si ce n'est pas du JSON, traiter comme une chaîne simple
                print(f"QR code non-JSON détecté: {qr_data}")
                
                # Essayer de détecter un ID de rendez-vous dans le texte
                if qr_data.isdigit():
                    # C'est probablement un ID de rendez-vous
                    qr_info = {
                        'type': 'appointment',
                        'appointment_id': int(qr_data)
                    }
                else:
                    # Chercher des patterns dans le texte
                    import re
                    appointment_match = re.search(r'APT-([A-F0-9]+)', qr_data.upper())
                    if appointment_match:
                        # Trouver le rendez-vous par référence
                        try:
                            appointment = Appointment.objects.get(
                                reference_number=f"APT-{appointment_match.group(1)}"
                            )
                            qr_info = {
                                'type': 'appointment',
                                'appointment_id': appointment.id
                            }
                        except Appointment.DoesNotExist:
                            pass
                    
                    if not qr_info:
                        # QR code texte simple - accès général
                        qr_info = {
                            'type': 'general',
                            'raw_data': qr_data
                        }
            
            # Vérifier le type de QR code
            qr_type = qr_info.get('type')
            
            if qr_type == 'appointment':
                # QR code de rendez-vous
                appointment_id = qr_info.get('appointment_id')
                if not appointment_id:
                    return Response({
                        'error': 'ID de rendez-vous manquant dans le QR code'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    appointment = Appointment.objects.select_related(
                        'user', 'service_type', 'office'
                    ).get(id=appointment_id)
                    
                    # Vérifier si le rendez-vous est valide et aujourd'hui
                    today = timezone.now().date()
                    if appointment.appointment_date != today:
                        return Response({
                            'error': 'Rendez-vous non valide pour aujourd\'hui',
                            'appointment_date': appointment.appointment_date,
                            'today': today
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Log de l'accès
                    AuditLog.objects.create(
                        user=request.user,
                        action='QR_SCAN_APPOINTMENT',
                        details=f'Scan QR code rendez-vous {appointment_id}',
                        ip_address=request.META.get('REMOTE_ADDR', ''),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')
                    )
                    
                    return Response({
                        'success': True,
                        'type': 'appointment',
                        'data': {
                            'appointment_id': appointment.id,
                            'user': {
                                'id': appointment.user.id,
                                'first_name': appointment.user.first_name,
                                'last_name': appointment.user.last_name,
                                'email': appointment.user.email,
                                'phone': getattr(appointment.user.profile, 'phone', '') if hasattr(appointment.user, 'profile') else '',
                                'role': appointment.user.role,
                                'is_verified': appointment.user.is_verified,
                                'is_active': appointment.user.is_active
                            },
                            'appointment': {
                                'id': appointment.id,
                                'date': appointment.appointment_date,
                                'time': appointment.appointment_time,
                                'service': appointment.service_type.name if appointment.service_type else 'Service inconnu',
                                'office': appointment.office.name if appointment.office else 'Bureau inconnu',
                                'status': appointment.status,
                                'created_at': appointment.created_at,
                                'user_notes': appointment.user_notes or ''
                            },
                            'access_granted': appointment.status == 'CONFIRMED',
                            'reason': 'Rendez-vous confirmé pour aujourd\'hui' if appointment.status == 'CONFIRMED' else 'Rendez-vous non confirmé'
                        }
                    })
                    
                except Appointment.DoesNotExist:
                    return Response({
                        'error': 'Rendez-vous non trouvé'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            elif qr_type == 'user':
                # QR code personnel d'utilisateur
                user_id = qr_info.get('user_id')
                if not user_id:
                    return Response({
                        'error': 'ID utilisateur manquant dans le QR code'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    user = User.objects.get(id=user_id)
                    
                    # Log de l'accès
                    AuditLog.objects.create(
                        user=request.user,
                        action='QR_SCAN_USER',
                        details=f'Scan QR code utilisateur {user_id}',
                        ip_address=request.META.get('REMOTE_ADDR', ''),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')
                    )
                    
                    return Response({
                        'success': True,
                        'type': 'user',
                        'data': {
                            'user': {
                                'id': user.id,
                                'first_name': user.first_name,
                                'last_name': user.last_name,
                                'email': user.email,
                                'phone': getattr(user.profile, 'phone', '') if hasattr(user, 'profile') else '',
                                'role': user.role,
                                'is_verified': user.is_verified,
                                'is_active': user.is_active,
                                'date_joined': user.date_joined
                            },
                            'access_granted': user.is_active and user.is_verified,
                            'reason': 'Utilisateur vérifié et actif' if (user.is_active and user.is_verified) else 'Utilisateur non vérifié ou inactif'
                        }
                    })
                    
                except User.DoesNotExist:
                    return Response({
                        'error': 'Utilisateur non trouvé'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            elif qr_type == 'general':
                # QR code texte simple - accès général
                raw_data = qr_info.get('raw_data', qr_data)
                
                # Log de l'accès
                AuditLog.objects.create(
                    user=request.user,
                    action='QR_SCAN_GENERAL',
                    details=f'Scan QR code général: {raw_data}',
                    ip_address=request.META.get('REMOTE_ADDR', ''),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                return Response({
                    'success': True,
                    'type': 'general',
                    'data': {
                        'raw_data': raw_data,
                        'access_granted': True,
                        'reason': 'Accès général autorisé',
                        'scanned_at': timezone.now().isoformat(),
                        'scanned_by': {
                            'id': request.user.id,
                            'name': f"{request.user.first_name} {request.user.last_name}",
                            'role': request.user.role
                        }
                    }
                })
            
            else:
                return Response({
                    'error': f'Type de QR code non supporté: {qr_type}'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'error': 'Erreur lors du scan du QR code',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SiteSettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les paramètres du site
    Admin/SuperAdmin uniquement
    """
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer
    permission_classes = (IsAuthenticated, IsAdmin)
    
    def get_object(self):
        """Retourne toujours l'objet singleton"""
        return SiteSettings.get_settings()
    
    def list(self, request, *args, **kwargs):
        """Rediriger vers l'objet unique"""
        settings = self.get_object()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Créer l'objet singleton s'il n'existe pas"""
        settings = SiteSettings.get_settings()
        serializer = self.get_serializer(settings, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        """Mettre à jour l'objet singleton"""
        settings = self.get_object()
        serializer = self.get_serializer(settings, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """Endpoint public pour récupérer les paramètres (avec messages)"""
        settings = SiteSettings.get_settings()
        return Response({
            'registration_enabled': settings.registration_enabled,
            'registration_message': settings.registration_message,
            'appointments_enabled': settings.appointments_enabled,
            'appointments_message': settings.appointments_message,
            'applications_enabled': settings.applications_enabled,
            'applications_message': settings.applications_message,
            'payments_enabled': settings.payments_enabled,
            'payments_message': settings.payments_message,
            'site_maintenance_mode': settings.site_maintenance_mode,
            'maintenance_message': settings.maintenance_message,
        })