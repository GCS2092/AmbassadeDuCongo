"""
API views for Payments with PDF receipt generation
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.http import HttpResponse
import stripe

from .models import Payment, Refund
from .serializers import (
    PaymentSerializer, PaymentCreateSerializer,
    RefundSerializer, RefundRequestSerializer
)
from core.models import AuditLog, SiteSettings
from core.utils.pdf_generator import generate_receipt_pdf

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payments
    Users can only view their own payments
    """
    permission_classes = (IsAuthenticated,)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'payment_method', 'application']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return user's payments or all if staff"""
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE']:
            return Payment.objects.all()
        return Payment.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer
    
    def create(self, request, *args, **kwargs):
        """Vérifier si les paiements sont activés"""
        # Vérifier si les paiements sont activés
        site_settings = SiteSettings.get_settings()
        
        if not site_settings.payments_enabled:
            return Response(
                {
                    "error": "Les paiements en ligne sont actuellement désactivés.",
                    "message": site_settings.payments_message,
                    "payments_disabled": True
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
        """Create payment and log action"""
        payment = serializer.save()
        
        # Log creation
        AuditLog.objects.create(
            user=self.request.user,
            action='PAYMENT',
            description=f"Paiement initié: {payment.transaction_id}",
            content_type=ContentType.objects.get_for_model(Payment),
            object_id=payment.id
        )
    
    @action(detail=True, methods=['post'])
    def create_stripe_intent(self, request, pk=None):
        """Create Stripe Payment Intent"""
        payment = self.get_object()
        
        if payment.status != 'PENDING':
            return Response(
                {"error": "Ce paiement ne peut plus être traité."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create Stripe PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=int(payment.amount * 100),  # Stripe uses cents
                currency=payment.currency.lower(),
                metadata={
                    'transaction_id': payment.transaction_id,
                    'application_reference': payment.application.reference_number,
                    'user_email': payment.user.email
                },
                description=f"Paiement pour {payment.application.get_application_type_display()}"
            )
            
            # Update payment with Stripe info
            payment.provider_transaction_id = intent.id
            payment.status = 'PROCESSING'
            payment.save()
            
            return Response({
                "client_secret": intent.client_secret,
                "publishable_key": settings.STRIPE_PUBLIC_KEY
            })
            
        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def confirm_payment(self, request, pk=None):
        """Confirm payment completion"""
        payment = self.get_object()
        
        if payment.status == 'COMPLETED':
            return Response({"status": "Paiement déjà confirmé."})
        
        # Update payment status
        from django.utils import timezone
        payment.status = 'COMPLETED'
        payment.completed_at = timezone.now()
        payment.save()
        
        # Update application status
        payment.application.status = 'PAYMENT_RECEIVED'
        payment.application.save()
        
        # Log completion
        AuditLog.objects.create(
            user=request.user,
            action='PAYMENT',
            description=f"Paiement confirmé: {payment.transaction_id}",
            content_type=ContentType.objects.get_for_model(Payment),
            object_id=payment.id
        )
        
        # Create in-app notification
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=payment.user,
                channel=Notification.Channel.IN_APP,
                title='Paiement confirmé',
                message=f'Votre paiement de {payment.amount} {payment.currency} pour la demande {payment.application.reference_number} a été confirmé avec succès.',
                notification_type='PAYMENT_RECEIVED',
                related_object_type='payment',
                related_object_id=str(payment.id),
                status=Notification.Status.SENT
            )
        except Exception as e:
            import logging
            logger = logging.getLogger('embassy')
            logger.error(f"Failed to create payment notification: {e}")
        
        return Response({"status": "Paiement confirmé avec succès."})
    
    @action(detail=True, methods=['get'])
    def download_receipt(self, request, pk=None):
        """
        Download payment receipt as PDF (GRATUIT - ReportLab)
        """
        payment = self.get_object()
        
        if payment.status != 'COMPLETED':
            return Response(
                {"error": "Le reçu n'est disponible que pour les paiements terminés."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate PDF
        pdf_buffer = generate_receipt_pdf(payment)
        
        # Create response
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        filename = f"recu_{payment.receipt_number or payment.transaction_id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Log download
        AuditLog.objects.create(
            user=request.user,
            action='DOWNLOAD',
            description=f"Téléchargement reçu: {payment.receipt_number}",
            content_type=ContentType.objects.get_for_model(Payment),
            object_id=payment.id
        )
        
        return response
    
    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """Get user's payment history"""
        payments = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)


class RefundViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing refunds
    """
    permission_classes = (IsAuthenticated,)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'payment']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return user's refunds or all if staff"""
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE']:
            return Refund.objects.all()
        return Refund.objects.filter(requested_by=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RefundRequestSerializer
        return RefundSerializer
    
    def perform_create(self, serializer):
        """Create refund request and log action"""
        refund = serializer.save()
        
        # Log creation
        AuditLog.objects.create(
            user=self.request.user,
            action='CREATE',
            description=f"Demande de remboursement: {refund.refund_id}",
            content_type=ContentType.objects.get_for_model(Refund),
            object_id=refund.id
        )
