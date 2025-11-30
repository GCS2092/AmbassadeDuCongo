"""
Notifications synchrones pour contourner les problèmes Django-Q
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Notification
import logging

logger = logging.getLogger('embassy')

def send_email_notification_sync(recipient_email, subject, template_name, context):
    """
    Send email notification synchronously
    """
    try:
        # Render email templates
        text_content = render_to_string(f'emails/{template_name}.txt', context)
        html_content = render_to_string(f'emails/{template_name}.html', context)
        
        # Send email
        send_mail(
            subject=subject,
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_content,
            fail_silently=False
        )
        logger.info(f"Email sent to {recipient_email}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email to {recipient_email}: {e}")
        return False

def notify_application_received_sync(application_id):
    """Send notification to admin when new application is received (sync version)"""
    from applications.models import Application
    
    User = get_user_model()
    try:
        application = Application.objects.get(id=application_id)
        
        # Get all admin users
        admin_users = User.objects.filter(role__in=['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE'])
        
        context = {
            'application': application,
            'applicant': application.applicant,
            'site_name': 'Ambassade du Congo',
            'site_url': 'http://localhost:3000'
        }

        # Send email to all admins
        for admin in admin_users:
            send_email_notification_sync(
                admin.email,
                f"Nouvelle demande reçue - {application.reference_number}",
                'application_received_admin',
                context
            )

        # Send email to applicant
        send_email_notification_sync(
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
        logger.error(f"Error in notify_application_received_sync: {e}")

def notify_application_status_changed_sync(application_id):
    """Send notification when application status changes (sync version)"""
    from applications.models import Application
    
    try:
        application = Application.objects.get(id=application_id)
        user = application.applicant
        
        context = {
            'user': user,
            'application': application,
            'site_name': 'Ambassade du Congo',
            'site_url': 'http://localhost:3000'
        }
        
        # Send email
        send_email_notification_sync(
            user.email,
            f'Mise à jour de votre demande {application.reference_number}',
            'application_status_changed',
            context
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
        logger.error(f"Error in notify_application_status_changed_sync: {e}")
