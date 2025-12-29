"""
Django signals for User app
Auto-create Profile when User is created
Désactiver automatiquement les utilisateurs sans carte consulaire
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import User, Profile
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create Profile automatically when User is created"""
    if created:
        Profile.objects.create(user=instance)
        
        # Ne plus générer automatiquement de numéro de carte consulaire
        # L'utilisateur doit fournir un numéro valide lors de l'inscription
        # Si pas de numéro, le compte sera désactivé


@receiver(post_save, sender=User)
def check_consular_card_and_deactivate(sender, instance, **kwargs):
    """Désactiver automatiquement les utilisateurs sans carte consulaire"""
    # Ne JAMAIS désactiver les admins/superadmins qui sont des employés de l'ambassade
    # Les agents (AGENT_RDV, AGENT_CONSULAIRE) sont aussi des employés
    # VIGILE est retiré de l'exception pour tester le comportement sans carte consulaire
    if instance.role in ['ADMIN', 'SUPERADMIN', 'AGENT_RDV', 'AGENT_CONSULAIRE']:
        return
    
    # Pour tous les autres rôles (y compris VIGILE pour test), si pas de carte consulaire, désactiver le compte
    if not instance.consular_card_number:
        # Utiliser update pour éviter la récursion infinie
        # Entourer dans un try/except pour éviter les erreurs de transaction
        try:
            User.objects.filter(pk=instance.pk).update(
                is_active=False,
                is_verified=False
            )
        except Exception as e:
            logger.warning(f"Erreur lors de la désactivation de l'utilisateur {instance.id}: {e}")


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save Profile when User is saved - Only if profile exists and has changes"""
    # Ne sauvegarder le profil que si :
    # 1. Le profil existe
    # 2. Ce n'est pas une création (created=True) car create_user_profile s'en charge
    # 3. La transaction est propre (pas d'erreur en cours)
    
    # Ignorer si c'est une création
    if kwargs.get('created', False):
        return
    
    # Ignorer si le profil n'existe pas encore
    if not hasattr(instance, 'profile'):
        return
    
    # Ne sauvegarder que si nous sommes dans une transaction propre
    try:
        # Vérifier si nous sommes dans une transaction atomique avec erreur
        if transaction.get_connection().in_atomic_block:
            # Ne pas tenter de sauvegarder si une erreur s'est produite
            if transaction.get_connection().needs_rollback:
                logger.debug(f"Transaction en erreur, pas de sauvegarde du profil pour l'utilisateur {instance.id}")
                return
        
        # Sauvegarder le profil uniquement s'il n'y a pas d'erreur
        instance.profile.save()
        
    except Exception as e:
        # Logger l'erreur mais ne pas bloquer la sauvegarde de l'utilisateur
        logger.warning(f"Erreur lors de la sauvegarde du profil pour l'utilisateur {instance.id}: {e}")