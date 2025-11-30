"""
Asynchronous tasks for notifications using django-q
"""
from django_q.tasks import async_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from .models import Notification, NotificationTemplate, PushDevice
import logging

logger = logging.getLogger('embassy')


def send_email_notification(recipient_email, subject, template_name, context):
    """
    Send email notification using template
    """
    try:
        # Render email templates
        text_content = render_to_string(f'emails/{template_name}.txt', context)
        html_content = render_to_string(f'emails/{template_name}.html', context)
        
        # Create email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send()
        logger.info(f"Email sent to {recipient_email}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email to {recipient_email}: {e}")
        return False


def send_sms_notification(phone_number, message):
    """
    Send SMS notification using Twilio
    """
    try:
        from twilio.rest import Client
        
        account_sid = settings.TWILIO_ACCOUNT_SID
        auth_token = settings.TWILIO_AUTH_TOKEN
        from_number = settings.TWILIO_PHONE_NUMBER
        
        client = Client(account_sid, auth_token)
        
        message = client.messages.create(
            body=message,
            from_=from_number,
            to=phone_number
        )
        
        logger.info(f"SMS sent to {phone_number}: {message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending SMS to {phone_number}: {e}")
        return False


def send_push_notification(user, title, body, data=None):
    """
    Send push notification using Firebase Cloud Messaging
    """
    try:
        import requests
        
        # Get user's active devices
        devices = PushDevice.objects.filter(user=user, is_active=True)
        
        if not devices.exists():
            logger.info(f"No active push devices for user {user.email}")
            return False
        
        fcm_url = "https://fcm.googleapis.com/fcm/send"
        headers = {
            "Authorization": f"key={settings.FCM_SERVER_KEY}",
            "Content-Type": "application/json"
        }
        
        success_count = 0
        for device in devices:
            payload = {
                "to": device.token,
                "notification": {
                    "title": title,
                    "body": body,
                    "icon": "/static/icons/icon-192x192.png"
                },
                "data": data or {}
            }
            
            response = requests.post(fcm_url, json=payload, headers=headers)
            
            if response.status_code == 200:
                success_count += 1
                device.save()  # Update last_used
            else:
                logger.error(f"FCM error for device {device.id}: {response.text}")
        
        logger.info(f"Push notification sent to {success_count}/{devices.count()} devices for user {user.email}")
        return success_count > 0
        
    except Exception as e:
        logger.error(f"Error sending push notification to user {user.email}: {e}")
        return False


def notify_appointment_confirmed(appointment_id):
    """Send notification for confirmed appointment"""
    from appointments.models import Appointment
    
    try:
        appointment = Appointment.objects.get(id=appointment_id)
        user = appointment.user
        
        context = {
            'user': user,
            'appointment': appointment,
            'site_name': 'Ambassade du Congo'
        }
        
        # Send email
        async_task(
            send_email_notification,
            user.email,
            'Rendez-vous confirmé',
            'appointment_confirmed',
            context
        )
        
        # Send push
        async_task(
            send_push_notification,
            user,
            'Rendez-vous confirmé',
            f'Votre rendez-vous du {appointment.appointment_date} est confirmé.',
            {'type': 'appointment', 'id': str(appointment.id)}
        )
        
        # Create in-app notification
        Notification.objects.create(
            recipient=user,
            channel='IN_APP',
            title='Rendez-vous confirmé',
            message=f'Votre rendez-vous du {appointment.appointment_date} à {appointment.appointment_time} est confirmé.',
            notification_type='APPOINTMENT',
            related_object_type='appointment',
            related_object_id=str(appointment.id),
            status='SENT'
        )
        
    except Exception as e:
        logger.error(f"Error in notify_appointment_confirmed: {e}")


def notify_appointment_status_changed(appointment_id):
    """Send notification when appointment status changes (generic)"""
    from appointments.models import Appointment
    try:
        appointment = Appointment.objects.get(id=appointment_id)
        user = appointment.user

        context = {
            'user': user,
            'appointment': appointment,
            'site_name': 'Ambassade du Congo'
        }

        # Email
        async_task(
            send_email_notification,
            user.email,
            f"Mise à jour de votre rendez-vous {appointment.reference_number}",
            'appointment_status_changed',
            context
        )

        # Push
        async_task(
            send_push_notification,
            user,
            'Mise à jour de rendez-vous',
            f"Statut: {appointment.get_status_display()}",
            {'type': 'appointment', 'id': str(appointment.id)}
        )

        # In-app record
        Notification.objects.create(
            recipient=user,
            channel='IN_APP',
            title='Mise à jour de rendez-vous',
            message=f"Votre rendez-vous {appointment.reference_number} a été mis à jour. Statut: {appointment.get_status_display()}",
            notification_type='APPOINTMENT',
            related_object_type='appointment',
            related_object_id=str(appointment.id),
            status='SENT'
        )
    except Exception as e:
        logger.error(f"Error in notify_appointment_status_changed: {e}")

def notify_application_received(application_id):
    """Send notification to admin when new application is received"""
    from applications.models import Application
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    try:
        application = Application.objects.get(id=application_id)
        
        # Get all admin users
        admin_users = User.objects.filter(role__in=['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE'])
        
        context = {
            'application': application,
            'applicant': application.applicant,
            'site_name': 'Ambassade du Congo'
        }

        # Send email to all admins
        for admin in admin_users:
            async_task(
                send_email_notification,
                admin.email,
                f"Nouvelle demande reçue - {application.reference_number}",
                'application_received_admin',
                context
            )

        # Send email to applicant
        async_task(
            send_email_notification,
            application.applicant.email,
            f"Votre demande a été reçue - {application.reference_number}",
            'application_received_user',
            context
        )

        # Create in-app notifications for admins
        for admin in admin_users:
            Notification.objects.create(
                recipient=admin,
                channel='IN_APP',
                title='Nouvelle demande reçue',
                message=f"Demande {application.reference_number} de {application.applicant.get_full_name()}",
                notification_type='APPLICATION',
                related_object_type='application',
                related_object_id=str(application.id),
                status='SENT'
            )

        # Create in-app notification for applicant
        Notification.objects.create(
            recipient=application.applicant,
            channel='IN_APP',
            title='Demande reçue',
            message=f"Votre demande {application.reference_number} a été reçue et est en cours de traitement",
            notification_type='APPLICATION',
            related_object_type='application',
            related_object_id=str(application.id),
            status='SENT'
        )
        
    except Exception as e:
        logger.error(f"Error in notify_application_received: {e}")


def notify_application_status_changed(application_id):
    """Send notification when application status changes"""
    from applications.models import Application
    
    try:
        application = Application.objects.get(id=application_id)
        user = application.applicant
        
        context = {
            'user': user,
            'application': application,
            'site_name': 'Ambassade du Congo'
        }
        
        # Send email
        async_task(
            send_email_notification,
            user.email,
            f'Mise à jour de votre demande {application.reference_number}',
            'application_status_changed',
            context
        )
        
        # Send push
        async_task(
            send_push_notification,
            user,
            'Mise à jour de demande',
            f'Statut: {application.get_status_display()}',
            {'type': 'application', 'id': str(application.id)}
        )
        
        # Create in-app notification
        Notification.objects.create(
            recipient=user,
            channel='IN_APP',
            title='Mise à jour de demande',
            message=f'Votre demande {application.reference_number} a été mise à jour. Statut: {application.get_status_display()}',
            notification_type='APPLICATION',
            related_object_type='application',
            related_object_id=str(application.id),
            status='SENT'
        )
        
    except Exception as e:
        logger.error(f"Error in notify_application_status_changed: {e}")


def notify_payment_received(payment_id):
    """Send notification for successful payment"""
    from payments.models import Payment
    
    try:
        payment = Payment.objects.get(id=payment_id)
        user = payment.user
        
        context = {
            'user': user,
            'payment': payment,
            'site_name': 'Ambassade du Congo'
        }
        
        # Send email
        async_task(
            send_email_notification,
            user.email,
            f'Paiement reçu - {payment.transaction_id}',
            'payment_received',
            context
        )
        
        # Send push
        async_task(
            send_push_notification,
            user,
            'Paiement reçu',
            f'Votre paiement de {payment.amount} {payment.currency} a été confirmé.',
            {'type': 'payment', 'id': str(payment.id)}
        )
        
        # Create in-app notification
        Notification.objects.create(
            recipient=user,
            channel='IN_APP',
            title='Paiement reçu',
            message=f'Votre paiement de {payment.amount} {payment.currency} a été confirmé. Reçu: {payment.receipt_number}',
            notification_type='PAYMENT',
            related_object_type='payment',
            related_object_id=str(payment.id),
            status='SENT'
        )
        
    except Exception as e:
        logger.error(f"Error in notify_payment_received: {e}")


def notify_application_missing_documents(application_id, missing_documents=None, note: str = ""):
    """Notify applicant that documents are missing for their application"""
    from applications.models import Application
    try:
        application = Application.objects.get(id=application_id)
        user = application.applicant

        context = {
            'user': user,
            'application': application,
            'missing_documents': missing_documents or [],
            'note': note,
            'site_name': 'Ambassade du Congo'
        }

        # Email
        async_task(
            send_email_notification,
            user.email,
            f"Documents manquants pour votre demande {application.reference_number}",
            'application_missing_documents',
            context
        )

        # In-app
        Notification.objects.create(
            recipient=user,
            channel='IN_APP',
            title='Documents manquants',
            message=(
                f"Votre demande {application.reference_number} nécessite des documents complémentaires. "
                f"{('Détails: ' + note) if note else ''}"
            ).strip(),
            notification_type='APPLICATION',
            related_object_type='application',
            related_object_id=str(application.id),
            status='SENT'
        )
    except Exception as e:
        logger.error(f"Error in notify_application_missing_documents: {e}")

def send_appointment_reminder(appointment_id):
    """Send reminder before appointment (to be scheduled)"""
    from appointments.models import Appointment
    from datetime import datetime, timedelta
    
    try:
        appointment = Appointment.objects.get(id=appointment_id)
        user = appointment.user
        
        # Only send if appointment is in next 24-48 hours
        now = datetime.now().date()
        days_until = (appointment.appointment_date - now).days
        
        if days_until not in [1, 2]:
            return
        
        context = {
            'user': user,
            'appointment': appointment,
            'days_until': days_until,
            'site_name': 'Ambassade du Congo'
        }
        
        # Send email
        async_task(
            send_email_notification,
            user.email,
            f'Rappel: Rendez-vous dans {days_until} jour(s)',
            'appointment_reminder',
            context
        )
        
        # Send SMS (important reminder)
        if user.phone_number:
            message = f"Rappel: Votre rendez-vous à l'Ambassade du Congo est prévu le {appointment.appointment_date} à {appointment.appointment_time}. Référence: {appointment.reference_number}"
            async_task(send_sms_notification, user.phone_number, message)
        
        # Mark reminder as sent
        appointment.reminder_sent = True
        appointment.save()
        
    except Exception as e:
        logger.error(f"Error in send_appointment_reminder: {e}")

