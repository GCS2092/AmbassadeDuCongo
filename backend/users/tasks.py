"""
Tâches asynchrones pour la gestion des documents
"""
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from .models import UserDocument, DocumentReminder
from django_q.tasks import async_task

logger = logging.getLogger(__name__)


def send_document_expiry_email(reminder):
    """Envoyer un email de rappel d'expiration de document"""
    try:
        subject = f"⚠️ Rappel : {reminder.document.name} expire bientôt"
        
        context = {
            'user': reminder.user,
            'document': reminder.document,
            'expiry_date': reminder.expiry_date,
            'days_remaining': reminder.days_until_expiry,
        }
        
        html_message = render_to_string('emails/document_expiry_reminder.html', context)
        plain_message = render_to_string('emails/document_expiry_reminder.txt', context)
        
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [reminder.user.email],
            html_message=html_message,
            fail_silently=False
        )
        
        logger.info(f"Email de rappel envoyé à {reminder.user.email} pour le document {reminder.document.name}")
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email de rappel: {e}")
        return False


def check_and_send_document_expiry_reminders():
    """
    Vérifie les documents qui expirent bientôt et envoie des rappels par email
    """
    try:
        today = timezone.now().date()
        logger.info(f"Démarrage de la vérification des documents expirant bientôt - {today}")
        
        # Trouver tous les documents expirant dans 3 jours
        documents_expiring = UserDocument.objects.filter(
            expiry_date__isnull=False,
            expiry_date__gte=today,
            expiry_date__lte=today + timedelta(days=3)
        )
        
        logger.info(f"{documents_expiring.count()} document(s) expirant dans 3 jours")
        
        for document in documents_expiring:
            try:
                # Calculer les jours restants
                days_remaining = (document.expiry_date - today).days
                
                # Déterminer la priorité
                priority = 'URGENT' if days_remaining <= 3 else 'HIGH'
                
                # Créer ou obtenir un rappel
                reminder, created = DocumentReminder.objects.get_or_create(
                    document=document,
                    user=document.user,
                    defaults={
                        'expiry_date': document.expiry_date,
                        'days_until_expiry': days_remaining,
                        'priority': priority,
                    }
                )
                
                # Envoyer l'email si pas déjà envoyé et si le document expire dans 3 jours
                if not reminder.email_sent and days_remaining <= 3:
                    success = send_document_expiry_email(reminder)
                    if success:
                        reminder.email_sent = True
                        reminder.email_sent_at = timezone.now()
                        reminder.save()
                        logger.info(f"Rappel envoyé pour le document {document.name} de {document.user.email}")
                
            except Exception as e:
                logger.error(f"Erreur lors du traitement du document {document.id}: {e}")
        
        logger.info("Vérification des documents terminée")
        
    except Exception as e:
        logger.error(f"Erreur lors de la vérification des documents expirant: {e}")


# Tâche asynchrone pour être appelée régulièrement
def schedule_document_expiry_check():
    """Planifier la vérification des documents expirant"""
    async_task('users.tasks.check_and_send_document_expiry_reminders')
