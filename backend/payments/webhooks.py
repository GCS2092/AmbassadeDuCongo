"""
Stripe webhook handlers for payment events
"""
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
import stripe
import json

from .models import Payment
from core.models import AuditLog


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Handle Stripe webhook events
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        # Invalid payload
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return HttpResponse(status=400)
    
    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        handle_payment_success(payment_intent)
    
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        handle_payment_failure(payment_intent)
    
    return HttpResponse(status=200)


def handle_payment_success(payment_intent):
    """Handle successful payment"""
    try:
        payment = Payment.objects.get(
            provider_transaction_id=payment_intent['id']
        )
        
        from django.utils import timezone
        payment.status = 'COMPLETED'
        payment.completed_at = timezone.now()
        payment.provider_response = payment_intent
        payment.save()
        
        # Update application status
        payment.application.status = 'PAYMENT_RECEIVED'
        payment.application.save()
        
        # Log event
        AuditLog.objects.create(
            action='PAYMENT',
            description=f"Paiement Stripe réussi: {payment.transaction_id}",
            metadata={'payment_intent_id': payment_intent['id']}
        )
        
        # Create in-app notification
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=payment.user,
                channel=Notification.Channel.IN_APP,
                title='Paiement réussi',
                message=f'Votre paiement de {payment.amount} {payment.currency} pour la demande {payment.application.reference_number} a été traité avec succès.',
                notification_type='PAYMENT_RECEIVED',
                related_object_type='payment',
                related_object_id=str(payment.id),
                status=Notification.Status.SENT
            )
        except Exception as e:
            import logging
            logger = logging.getLogger('embassy')
            logger.error(f"Failed to create payment notification: {e}")
        
    except Payment.DoesNotExist:
        pass


def handle_payment_failure(payment_intent):
    """Handle failed payment"""
    try:
        payment = Payment.objects.get(
            provider_transaction_id=payment_intent['id']
        )
        
        payment.status = 'FAILED'
        payment.failure_reason = payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
        payment.provider_response = payment_intent
        payment.save()
        
        # Log event
        AuditLog.objects.create(
            action='PAYMENT',
            description=f"Paiement Stripe échoué: {payment.transaction_id}",
            metadata={'payment_intent_id': payment_intent['id'], 'error': payment.failure_reason}
        )
        
        # Create in-app notification for failure
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=payment.user,
                channel=Notification.Channel.IN_APP,
                title='Paiement échoué',
                message=f'Votre paiement de {payment.amount} {payment.currency} pour la demande {payment.application.reference_number} a échoué. Veuillez réessayer.',
                notification_type='PAYMENT_FAILED',
                related_object_type='payment',
                related_object_id=str(payment.id),
                status=Notification.Status.SENT
            )
        except Exception as e:
            import logging
            logger = logging.getLogger('embassy')
            logger.error(f"Failed to create payment failure notification: {e}")
        
    except Payment.DoesNotExist:
        pass

