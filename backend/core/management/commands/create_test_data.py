"""
Commande Django pour créer des données de test pour le dashboard
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
import random

from appointments.models import Appointment
from applications.models import Application
from core.models import ConsularOffice, ServiceType

User = get_user_model()

class Command(BaseCommand):
    help = 'Crée des données de test pour le dashboard'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-email',
            type=str,
            default='slovengama@gmail.com',
            help='Email de l\'utilisateur pour lequel créer les données'
        )

    def handle(self, *args, **options):
        user_email = options['user_email']
        
        try:
            user = User.objects.get(email=user_email)
            self.stdout.write(f'Création de données de test pour: {user.email}')
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Utilisateur {user_email} non trouvé')
            )
            return

        # Créer ou récupérer des bureaux et services
        office, _ = ConsularOffice.objects.get_or_create(
            name='Ambassade de la République du Congo - Dakar',
            defaults={
                'office_type': 'EMBASSY',
                'address_line1': 'Avenue Léopold Sédar Senghor',
                'city': 'Dakar',
                'country': 'Sénégal',
                'is_active': True
            }
        )

        service, _ = ServiceType.objects.get_or_create(
            name='Demande de passeport',
            defaults={
                'category': 'PASSPORT',
                'description': 'Renouvellement ou première demande de passeport',
                'is_active': True,
                'base_fee': 50000.00,
                'processing_time_days': 10
            }
        )
        
        # Ajouter l'office au service
        service.offices.add(office)

        # Créer des rendez-vous de test
        today = timezone.now().date()
        
        # Rendez-vous à venir (dans les 7 prochains jours)
        for i in range(3):
            appointment_date = today + timedelta(days=random.randint(1, 7))
            appointment_time = f"{random.randint(9, 17):02d}:00"
            
            Appointment.objects.get_or_create(
                user=user,
                office=office,
                service_type=service,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                defaults={
                    'status': 'CONFIRMED' if i < 2 else 'PENDING',
                    'reference_number': f'APT-{random.randint(1000, 9999)}',
                    'user_notes': f'Rendez-vous de test {i+1}'
                }
            )

        # Créer des demandes de test
        statuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PROCESSING', 'READY']
        
        for i, status in enumerate(statuses):
            Application.objects.get_or_create(
                applicant=user,
                service_type=service,
                office=office,
                defaults={
                    'application_type': 'PASSPORT',
                    'status': status,
                    'reference_number': f'APP-{random.randint(1000, 9999)}',
                    'applicant_notes': f'Demande de test {i+1}',
                    'submitted_at': timezone.now() if status != 'DRAFT' else None,
                    'base_fee': 50000.00,
                    'total_fee': 50000.00
                }
            )

        # Statistiques finales
        appointments_count = Appointment.objects.filter(user=user).count()
        applications_count = Application.objects.filter(applicant=user).count()
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Données de test créées:')
        )
        self.stdout.write(f'   📅 Rendez-vous: {appointments_count}')
        self.stdout.write(f'   📋 Demandes: {applications_count}')
        self.stdout.write(f'   👤 Utilisateur: {user.email}')
        
        self.stdout.write(
            self.style.SUCCESS('\n🎯 Le dashboard devrait maintenant afficher des données!')
        )
