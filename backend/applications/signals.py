"""
Signals for application notifications
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Application
from notifications.sync_tasks import notify_application_status_changed_sync, notify_application_received_sync


@receiver(post_save, sender=Application)
def application_created_notification(sender, instance, created, **kwargs):
    """
    Send notification when application is created
    """
    if created:
        # Notify admin about new application
        notify_application_received_sync(instance.id)
        
        # Log the creation
        from core.models import AuditLog
        from django.contrib.contenttypes.models import ContentType
        
        AuditLog.objects.create(
            user=instance.applicant,
            action='CREATE',
            description=f"Demande créée: {instance.reference_number}",
            content_type=ContentType.objects.get_for_model(Application),
            object_id=instance.id
        )


@receiver(pre_save, sender=Application)
def application_status_changed_notification(sender, instance, **kwargs):
    """
    Send notification when application status changes
    """
    if instance.pk:
        try:
            old_instance = Application.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Status changed, send notification
                notify_application_status_changed_sync(instance.id)
                
                # Log the status change
                from core.models import AuditLog
                from django.contrib.contenttypes.models import ContentType
                
                AuditLog.objects.create(
                    user=instance.applicant,
                    action='UPDATE',
                    description=f"Statut changé: {old_instance.get_status_display()} → {instance.get_status_display()}",
                    content_type=ContentType.objects.get_for_model(Application),
                    object_id=instance.id
                )
        except Application.DoesNotExist:
            pass
