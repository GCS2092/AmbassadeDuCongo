"""
Management command to encrypt existing sensitive data
Run this AFTER creating the migration but BEFORE applying it in production
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from cryptography.fernet import Fernet
from users.models import User, Profile


class Command(BaseCommand):
    help = 'Encrypt existing sensitive data in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be encrypted without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if not settings.ENCRYPTION_KEY:
            self.stdout.write(
                self.style.ERROR('ENCRYPTION_KEY not set in settings. Cannot encrypt data.')
            )
            return
        
        try:
            fernet = Fernet(settings.ENCRYPTION_KEY.encode() if isinstance(settings.ENCRYPTION_KEY, str) else settings.ENCRYPTION_KEY)
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to initialize encryption: {e}')
            )
            return
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Encrypt User model fields
        users_updated = 0
        for user in User.objects.all():
            updated = False
            
            # Encrypt phone_number
            if user.phone_number and not user.phone_number.startswith('gAAAAAB'):  # Not already encrypted
                if not dry_run:
                    try:
                        encrypted = fernet.encrypt(user.phone_number.encode())
                        User.objects.filter(pk=user.pk).update(phone_number=encrypted.decode())
                        updated = True
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'Failed to encrypt phone_number for user {user.email}: {e}')
                        )
                else:
                    self.stdout.write(f'Would encrypt phone_number for user {user.email}')
                    updated = True
            
            # Encrypt consular_card_number
            if user.consular_card_number and not user.consular_card_number.startswith('gAAAAAB'):
                if not dry_run:
                    try:
                        encrypted = fernet.encrypt(user.consular_card_number.encode())
                        User.objects.filter(pk=user.pk).update(consular_card_number=encrypted.decode())
                        updated = True
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'Failed to encrypt consular_card_number for user {user.email}: {e}')
                        )
                else:
                    self.stdout.write(f'Would encrypt consular_card_number for user {user.email}')
                    updated = True
            
            if updated:
                users_updated += 1
        
        # Encrypt Profile model fields
        profiles_updated = 0
        for profile in Profile.objects.all():
            updated = False
            
            fields_to_encrypt = [
                'consular_number',
                'passport_number',
                'id_card_number',
                'birth_certificate_number',
                'driving_license_number',
                'work_phone',
                'emergency_contact_phone',
            ]
            
            update_dict = {}
            for field_name in fields_to_encrypt:
                value = getattr(profile, field_name, None)
                if value and not value.startswith('gAAAAAB'):  # Not already encrypted
                    if not dry_run:
                        try:
                            encrypted = fernet.encrypt(value.encode())
                            update_dict[field_name] = encrypted.decode()
                            updated = True
                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(f'Failed to encrypt {field_name} for profile {profile.user.email}: {e}')
                            )
                    else:
                        self.stdout.write(f'Would encrypt {field_name} for profile {profile.user.email}')
                        updated = True
            
            if update_dict:
                if not dry_run:
                    Profile.objects.filter(pk=profile.pk).update(**update_dict)
                profiles_updated += 1
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'DRY RUN: Would encrypt data for {users_updated} users and {profiles_updated} profiles'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully encrypted data for {users_updated} users and {profiles_updated} profiles'
                )
            )

