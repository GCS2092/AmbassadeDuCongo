"""
Management command to generate consular card numbers for existing users
Usage: python manage.py generate_consular_numbers
"""
from django.core.management.base import BaseCommand
from users.models import User
from users.utils import assign_consular_card_number


class Command(BaseCommand):
    help = 'Génère des numéros de carte consulaire pour les utilisateurs qui n\'en ont pas'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche ce qui serait fait sans modifier la base de données',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Trouver tous les utilisateurs sans numéro de carte consulaire
        users_without_number = User.objects.filter(
            consular_card_number__isnull=True
        ) | User.objects.filter(consular_card_number='')
        
        count = users_without_number.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('Tous les utilisateurs ont déjà un numéro de carte consulaire.')
            )
            return
        
        self.stdout.write(
            f'{"[DRY RUN] " if dry_run else ""}Trouvé {count} utilisateur(s) sans numéro de carte consulaire.'
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('Mode dry-run activé. Aucune modification ne sera effectuée.')
            )
        
        generated_count = 0
        errors = []
        
        for user in users_without_number:
            try:
                if not dry_run:
                    consular_number = assign_consular_card_number(user)
                    self.stdout.write(
                        f'✓ Numéro {consular_number} assigné à {user.get_full_name()} ({user.email})'
                    )
                else:
                    # En mode dry-run, simuler la génération
                    from users.utils import generate_consular_card_number
                    consular_number = generate_consular_card_number()
                    self.stdout.write(
                        f'[DRY RUN] Numéro {consular_number} serait assigné à {user.get_full_name()} ({user.email})'
                    )
                generated_count += 1
            except Exception as e:
                error_msg = f'Erreur pour {user.get_full_name()} ({user.email}): {str(e)}'
                errors.append(error_msg)
                self.stdout.write(self.style.ERROR(error_msg))
        
        # Résumé
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'{"[DRY RUN] " if dry_run else ""}Résumé:'))
        self.stdout.write(f'  - Utilisateurs traités: {generated_count}/{count}')
        if errors:
            self.stdout.write(self.style.ERROR(f'  - Erreurs: {len(errors)}'))
            for error in errors:
                self.stdout.write(self.style.ERROR(f'    • {error}'))

