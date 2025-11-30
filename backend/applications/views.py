"""
API views for Applications and Documents
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.contenttypes.models import ContentType
from .models import Document, Application
from .serializers import (
    DocumentSerializer, ApplicationSerializer, ApplicationCreateSerializer
)
from core.models import AuditLog, SiteSettings
from core.permissions import IsAgent
from notifications.tasks import notify_application_missing_documents


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing documents
    Users can only view/manage their own documents
    """
    serializer_class = DocumentSerializer
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['document_type', 'is_verified']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return user's documents"""
        return Document.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        """Create document and set owner"""
        document = serializer.save(owner=self.request.user)
        
        # Log upload
        AuditLog.objects.create(
            user=self.request.user,
            action='CREATE',
            description=f"Document téléversé: {document.get_document_type_display()}",
            content_type=ContentType.objects.get_for_model(Document),
            object_id=document.id
        )


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing applications
    Users can only view/manage their own applications
    """
    permission_classes = (IsAuthenticated,)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'application_type', 'office', 'service_type']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return user's applications or all if staff"""
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE']:
            return Application.objects.all()
        return Application.objects.filter(applicant=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ApplicationCreateSerializer
        return ApplicationSerializer
    
    def create(self, request, *args, **kwargs):
        """Vérifier si les demandes sont activées"""
        # Vérifier si les demandes sont activées
        site_settings = SiteSettings.get_settings()
        
        if not site_settings.applications_enabled:
            return Response(
                {
                    "error": "La soumission de demandes est actuellement désactivée.",
                    "message": site_settings.applications_message,
                    "applications_disabled": True
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
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Create application and log action"""
        application = serializer.save()
        
        # Log creation
        AuditLog.objects.create(
            user=self.request.user,
            action='CREATE',
            description=f"Demande créée: {application.reference_number}",
            content_type=ContentType.objects.get_for_model(Application),
            object_id=application.id
        )
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit application for review"""
        application = self.get_object()
        
        if application.status != 'DRAFT':
            return Response(
                {"error": "Seules les demandes en brouillon peuvent être soumises."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if documents are provided
        if not application.documents.exists():
            return Response(
                {"error": "Veuillez téléverser les documents requis avant de soumettre."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.utils import timezone
        application.status = 'SUBMITTED'
        application.submitted_at = timezone.now()
        application.save()
        
        # Log submission
        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            description=f"Demande soumise: {application.reference_number}",
            content_type=ContentType.objects.get_for_model(Application),
            object_id=application.id
        )
        
        return Response({"status": "Demande soumise avec succès."})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel application - only by owner or admin with justification"""
        application = self.get_object()
        user = request.user
        
        # Vérifier si l'utilisateur peut annuler cette demande
        can_cancel = False
        cancellation_reason = ""
        
        if application.applicant == user:
            # Le propriétaire peut annuler sa propre demande
            can_cancel = True
            cancellation_reason = "Annulée par le demandeur"
        elif user.role in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE']:
            # L'admin peut annuler mais doit fournir une justification
            reason = request.data.get('admin_reason', '').strip()
            if not reason:
                return Response(
                    {"error": "Une justification administrative est requise pour annuler cette demande."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            can_cancel = True
            cancellation_reason = f"Annulée par l'administration: {reason}"
        else:
            return Response(
                {"error": "Vous n'êtes pas autorisé à annuler cette demande."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not can_cancel or not application.can_be_cancelled:
            return Response(
                {"error": "Cette demande ne peut pas être annulée."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Annuler la demande
        application.status = 'CANCELLED'
        if user.role in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE']:
            application.admin_notes = f"{application.admin_notes or ''}\n\nAnnulation: {request.data.get('admin_reason', '')}".strip()
        application.save()
        
        # Log cancellation
        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            description=f"Demande annulée: {application.reference_number} - {cancellation_reason}",
            content_type=ContentType.objects.get_for_model(Application),
            object_id=application.id
        )
        
        return Response({
            "status": "Demande annulée avec succès.",
            "reason": cancellation_reason
        })
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update application status"""
        application = self.get_object()
        user = request.user
        
        # Vérifier les permissions
        if user.role not in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE']:
            return Response(
                {"error": "Vous n'êtes pas autorisé à modifier le statut des demandes."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')
        rejection_reason = request.data.get('rejection_reason', '')
        
        if not new_status:
            return Response(
                {"error": "Le nouveau statut est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier les transitions de statut valides
        valid_transitions = {
            'DRAFT': ['SUBMITTED', 'CANCELLED'],
            'SUBMITTED': ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
            'UNDER_REVIEW': ['ADDITIONAL_INFO_REQUIRED', 'PAYMENT_PENDING', 'PROCESSING', 'REJECTED', 'CANCELLED'],
            'ADDITIONAL_INFO_REQUIRED': ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
            'PAYMENT_PENDING': ['PAYMENT_RECEIVED', 'REJECTED', 'CANCELLED'],
            'PAYMENT_RECEIVED': ['PROCESSING', 'REJECTED', 'CANCELLED'],
            'PROCESSING': ['READY', 'REJECTED', 'CANCELLED'],
            'READY': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'REJECTED': ['UNDER_REVIEW'],
            'CANCELLED': []
        }
        
        if new_status not in valid_transitions.get(application.status, []):
            return Response(
                {"error": f"Transition de statut invalide de {application.status} vers {new_status}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mettre à jour le statut
        old_status = application.status
        application.status = new_status
        
        # Ajouter les notes administratives
        if admin_notes:
            application.admin_notes = f"{application.admin_notes or ''}\n\n{admin_notes}".strip()
        
        # Ajouter la raison de rejet si applicable
        if new_status == 'REJECTED' and rejection_reason:
            application.rejection_reason = rejection_reason
        
        # Marquer comme terminé si nécessaire
        if new_status == 'COMPLETED':
            from django.utils import timezone
            application.completed_at = timezone.now()
        
        application.save()
        
        # Log de la modification
        AuditLog.objects.create(
            user=user,
            action='UPDATE',
            description=f"Statut changé: {old_status} → {new_status} - {application.reference_number}",
            content_type=ContentType.objects.get_for_model(Application),
            object_id=application.id
        )
        
        return Response({
            "status": "Statut mis à jour avec succès.",
            "new_status": new_status,
            "old_status": old_status
        })
    
    @action(detail=False, methods=['get'])
    def drafts(self, request):
        """Get user's draft applications"""
        applications = self.get_queryset().filter(status='DRAFT')
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        """Get user's in-progress applications"""
        applications = self.get_queryset().filter(
            status__in=['SUBMITTED', 'UNDER_REVIEW', 'PROCESSING']
        )
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def completed(self, request):
        """Get user's completed applications"""
        applications = self.get_queryset().filter(
            status__in=['READY', 'COMPLETED']
        )
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAgent])
    def request_missing_documents(self, request, pk=None):
        """Agent: request missing documents from applicant with optional note and list"""
        application = self.get_object()
        missing_documents = request.data.get('missing_documents', [])
        note = request.data.get('note', '')

        try:
            notify_application_missing_documents(application.id, missing_documents, note)
        except Exception:
            return Response({"error": "Impossible d'envoyer la demande de documents."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        AuditLog.objects.create(
            user=request.user,
            action='NOTIFY',
            description=f"Documents manquants demandés: {application.reference_number}",
            content_type=ContentType.objects.get_for_model(Application),
            object_id=application.id
        )

        return Response({"status": "Demande de documents envoyée."})

    @action(detail=True, methods=['get'])
    def status_check(self, request, pk=None):
        """Check application status (public endpoint with reference)"""
        application = self.get_object()
        
        return Response({
            "reference_number": application.reference_number,
            "status": application.status,
            "status_display": application.get_status_display(),
            "submitted_at": application.submitted_at,
            "last_updated": application.updated_at
        })

