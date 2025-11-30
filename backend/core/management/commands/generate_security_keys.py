"""
Django management command to generate security keys
"""
from django.core.management.base import BaseCommand
from django.core.management.utils import get_random_secret_key
from cryptography.fernet import Fernet


class Command(BaseCommand):
    help = 'Génère les clés de sécurité nécessaires pour l\'application'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== Génération des clés de sécurité ===\n'))
        
        # Générer SECRET_KEY Django
        django_secret_key = get_random_secret_key()
        self.stdout.write(self.style.SUCCESS('✅ SECRET_KEY Django générée:'))
        self.stdout.write(f'   {django_secret_key}\n')
        
        # Générer ENCRYPTION_KEY pour chiffrement des données
        encryption_key = Fernet.generate_key().decode()
        self.stdout.write(self.style.SUCCESS('✅ ENCRYPTION_KEY générée:'))
        self.stdout.write(f'   {encryption_key}\n')
        
        # Instructions
        self.stdout.write(self.style.WARNING('\n⚠️  IMPORTANT: Ajoutez ces clés dans votre fichier .env:\n'))
        self.stdout.write(f'SECRET_KEY={django_secret_key}')
        self.stdout.write(f'ENCRYPTION_KEY={encryption_key}\n')
        self.stdout.write(self.style.ERROR('⚠️  NE PARTAGEZ JAMAIS CES CLÉS !\n'))

