"""
Commande Django pour configurer les utilisateurs admin et vigile
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class Command(BaseCommand):
    help = 'Configure les utilisateurs admin et vigile'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-email',
            type=str,
            default='slovengama@gmail.com',
            help='Email de l\'utilisateur admin'
        )
        parser.add_argument(
            '--vigile-email',
            type=str,
            default='Stemk2151@gmail.com',
            help='Email de l\'utilisateur vigile'
        )
        parser.add_argument(
            '--admin-password',
            type=str,
            default='Admin123!',
            help='Mot de passe de l\'utilisateur admin'
        )
        parser.add_argument(
            '--vigile-password',
            type=str,
            default='Vigile123!',
            help='Mot de passe de l\'utilisateur vigile'
        )

    def handle(self, *args, **options):
        admin_email = options['admin_email']
        vigile_email = options['vigile_email']
        admin_password = options['admin_password']
        vigile_password = options['vigile_password']

        with transaction.atomic():
            # Créer ou mettre à jour l'utilisateur admin
            admin_user, admin_created = User.objects.get_or_create(
                email=admin_email,
                defaults={
                    'first_name': 'Admin',
                    'last_name': 'System',
                    'role': 'ADMIN',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True,
                    'is_verified': True
                }
            )
            
            if not admin_created:
                # Mettre à jour l'utilisateur existant
                admin_user.role = 'ADMIN'
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.is_active = True
                admin_user.is_verified = True
                admin_user.save()
                self.stdout.write(
                    self.style.WARNING(f'Utilisateur admin existant mis à jour: {admin_email}')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Utilisateur admin créé: {admin_email}')
                )
            
            # Définir le mot de passe pour l'admin
            admin_user.set_password(admin_password)
            admin_user.save()

            # Créer ou mettre à jour l'utilisateur vigile
            vigile_user, vigile_created = User.objects.get_or_create(
                email=vigile_email,
                defaults={
                    'first_name': 'Vigile',
                    'last_name': 'Security',
                    'role': 'VIGILE',
                    'is_staff': False,
                    'is_superuser': False,
                    'is_active': True,
                    'is_verified': True
                }
            )
            
            if not vigile_created:
                # Mettre à jour l'utilisateur existant
                vigile_user.role = 'VIGILE'
                vigile_user.is_staff = False
                vigile_user.is_superuser = False
                vigile_user.is_active = True
                vigile_user.is_verified = True
                vigile_user.save()
                self.stdout.write(
                    self.style.WARNING(f'Utilisateur vigile existant mis à jour: {vigile_email}')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Utilisateur vigile créé: {vigile_email}')
                )
            
            # Définir le mot de passe pour le vigile
            vigile_user.set_password(vigile_password)
            vigile_user.save()

        # Afficher les informations de connexion
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('CONFIGURATION TERMINÉE'))
        self.stdout.write('='*60)
        
        self.stdout.write(f'\n🔑 ADMINISTRATEUR:')
        self.stdout.write(f'   Email: {admin_email}')
        self.stdout.write(f'   Mot de passe: {admin_password}')
        self.stdout.write(f'   Rôle: ADMIN')
        self.stdout.write(f'   Accès: http://localhost:3001/login')
        
        self.stdout.write(f'\n🛡️ VIGILE/SÉCURITÉ:')
        self.stdout.write(f'   Email: {vigile_email}')
        self.stdout.write(f'   Mot de passe: {vigile_password}')
        self.stdout.write(f'   Rôle: VIGILE')
        self.stdout.write(f'   Scanner QR: http://localhost:3001/security/scanner')
        
        self.stdout.write('\n📋 INFORMATIONS IMPORTANTES:')
        self.stdout.write('   • Les mots de passe sont définis dans ce script')
        self.stdout.write('   • Changez-les après la première connexion')
        self.stdout.write('   • L\'admin peut accéder à toutes les fonctionnalités')
        self.stdout.write('   • Le vigile peut scanner les QR codes des visiteurs')
        
        self.stdout.write('\n✅ Configuration réussie!')
        
        # Logger les informations
        logger.info(f'Admin user configured: {admin_email}')
        logger.info(f'Security user configured: {vigile_email}')
