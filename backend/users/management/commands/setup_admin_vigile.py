"""
Management command to setup admin and vigile test users
Usage: python manage.py setup_admin_vigile
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Setup admin and vigile test users for development'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔧 Configuration des utilisateurs de test...'))

        # Créer l'utilisateur Admin
        admin_user, created = User.objects.get_or_create(
            email='slovengama@gmail.com',
            defaults={
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'Ambassade',
                'role': 'ADMIN',
                'is_verified': True,
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        
        if created:
            admin_user.set_password('password123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('✅ Utilisateur Admin créé'))
        else:
            admin_user.set_password('password123')
            admin_user.save()
            self.stdout.write(self.style.WARNING('⚠️ Utilisateur Admin existe déjà - mot de passe mis à jour'))

        # Créer l'utilisateur Vigile
        vigile_user, created = User.objects.get_or_create(
            email='Stemk2151@gmail.com',
            defaults={
                'username': 'vigile',
                'first_name': 'Vigile',
                'last_name': 'Sécurité',
                'role': 'VIGILE',
                'is_verified': True,
                'is_active': True,
                'is_staff': True,
            }
        )
        
        if created:
            vigile_user.set_password('password123')
            vigile_user.save()
            self.stdout.write(self.style.SUCCESS('✅ Utilisateur Vigile créé'))
        else:
            vigile_user.set_password('password123')
            vigile_user.save()
            self.stdout.write(self.style.WARNING('⚠️ Utilisateur Vigile existe déjà - mot de passe mis à jour'))

        # Créer un utilisateur citoyen de test
        citizen_user, created = User.objects.get_or_create(
            email='citoyen@test.com',
            defaults={
                'username': 'citoyen_test',
                'first_name': 'Citoyen',
                'last_name': 'Test',
                'role': 'CITIZEN',
                'is_verified': True,
                'is_active': True,
            }
        )
        
        if created:
            citizen_user.set_password('password123')
            citizen_user.save()
            self.stdout.write(self.style.SUCCESS('✅ Utilisateur Citoyen de test créé'))
        else:
            citizen_user.set_password('password123')
            citizen_user.save()
            self.stdout.write(self.style.WARNING('⚠️ Utilisateur Citoyen existe déjà - mot de passe mis à jour'))

        # Créer l'utilisateur Agent Rendez-vous
        agent_rdv_user, created = User.objects.get_or_create(
            email='agent.rdv@ambassade.cg',
            defaults={
                'username': 'agent_rdv',
                'first_name': 'Agent',
                'last_name': 'Rendez-vous',
                'role': 'AGENT_RDV',
                'is_verified': True,
                'is_active': True,
                'is_staff': True,
            }
        )
        
        if created:
            agent_rdv_user.set_password('password123')
            agent_rdv_user.save()
            self.stdout.write(self.style.SUCCESS('✅ Utilisateur Agent Rendez-vous créé'))
        else:
            agent_rdv_user.set_password('password123')
            agent_rdv_user.save()
            self.stdout.write(self.style.WARNING('⚠️ Utilisateur Agent Rendez-vous existe déjà - mot de passe mis à jour'))

        # Créer l'utilisateur Agent Consulaire
        agent_consulaire_user, created = User.objects.get_or_create(
            email='agent.consulaire@ambassade.cg',
            defaults={
                'username': 'agent_consulaire',
                'first_name': 'Agent',
                'last_name': 'Consulaire',
                'role': 'AGENT_CONSULAIRE',
                'is_verified': True,
                'is_active': True,
                'is_staff': True,
            }
        )
        
        if created:
            agent_consulaire_user.set_password('password123')
            agent_consulaire_user.save()
            self.stdout.write(self.style.SUCCESS('✅ Utilisateur Agent Consulaire créé'))
        else:
            agent_consulaire_user.set_password('password123')
            agent_consulaire_user.save()
            self.stdout.write(self.style.WARNING('⚠️ Utilisateur Agent Consulaire existe déjà - mot de passe mis à jour'))

        self.stdout.write(self.style.SUCCESS(''))
        self.stdout.write(self.style.SUCCESS('🎉 Configuration terminée !'))
        self.stdout.write(self.style.SUCCESS(''))
        self.stdout.write(self.style.SUCCESS('👤 COMPTES DE TEST :'))
        self.stdout.write(self.style.SUCCESS(''))
        self.stdout.write(self.style.SUCCESS('ADMINISTRATEUR :'))
        self.stdout.write(self.style.SUCCESS('  Email: slovengama@gmail.com'))
        self.stdout.write(self.style.SUCCESS('  Mot de passe: password123'))
        self.stdout.write(self.style.SUCCESS(''))
        self.stdout.write(self.style.SUCCESS('VIGILE/SÉCURITÉ :'))
        self.stdout.write(self.style.SUCCESS('  Email: Stemk2151@gmail.com'))
        self.stdout.write(self.style.SUCCESS('  Mot de passe: password123'))
        self.stdout.write(self.style.SUCCESS(''))
        self.stdout.write(self.style.SUCCESS('AGENT RENDEZ-VOUS :'))
        self.stdout.write(self.style.SUCCESS('  Email: agent.rdv@ambassade.cg'))
        self.stdout.write(self.style.SUCCESS('  Mot de passe: password123'))
        self.stdout.write(self.style.SUCCESS(''))
        self.stdout.write(self.style.SUCCESS('AGENT CONSULAIRE :'))
        self.stdout.write(self.style.SUCCESS('  Email: agent.consulaire@ambassade.cg'))
        self.stdout.write(self.style.SUCCESS('  Mot de passe: password123'))
        self.stdout.write(self.style.SUCCESS(''))
        self.stdout.write(self.style.SUCCESS('CITOYEN TEST :'))
        self.stdout.write(self.style.SUCCESS('  Email: citoyen@test.com'))
        self.stdout.write(self.style.SUCCESS('  Mot de passe: password123'))
        self.stdout.write(self.style.SUCCESS(''))
