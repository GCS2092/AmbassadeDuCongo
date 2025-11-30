"""
Management command to setup initial data for the Embassy PWA
Usage: python manage.py setup_initial_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import ConsularOffice, ServiceType, FAQ
from notifications.models import NotificationTemplate


class Command(BaseCommand):
    help = 'Setup initial data for the Embassy application'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up initial data...'))

        # Create Consular Offices
        self.stdout.write('Creating consular offices...')
        offices = self.create_offices()

        # Create Service Types
        self.stdout.write('Creating service types...')
        services = self.create_services(offices)

        # Create FAQs
        self.stdout.write('Creating FAQs...')
        self.create_faqs()

        # Create Notification Templates
        self.stdout.write('Creating notification templates...')
        self.create_notification_templates()

        self.stdout.write(self.style.SUCCESS('✅ Initial data setup completed!'))

    def create_offices(self):
        """Create consular offices"""
        offices = []

        # Ambassade du Congo - Brazzaville
        office, created = ConsularOffice.objects.get_or_create(
            name="Ambassade de la République du Congo - Dakar",
            defaults={
                'office_type': 'EMBASSY',
                'address_line1': 'Stèle Mermoz, Pyrotechnie',
                'city': 'Dakar',
                'postal_code': '5243',
                'country': 'Sénégal',
                'latitude': 14.7167,
                'longitude': -17.4677,
                'phone_primary': '+221 824 8398',
                'phone_secondary': '+221 649 3117',
                'email': 'contact@ambassade-congo.sn',
                'opening_hours': 'Lundi - Vendredi: 9h00 - 17h00\nSamedi: 9h00 - 13h00\nDimanche: Fermé',
                'jurisdiction_countries': 'Sénégal, Gambie, Guinée-Bissau',
                'is_active': True,
                'accepts_appointments': True,
            }
        )
        offices.append(office)
        self.stdout.write(f'  ✓ {office.name}' + (' (created)' if created else ' (exists)'))

        return offices

    def create_services(self, offices):
        """Create service types"""
        services_data = [
            # Visas
            {
                'name': 'Visa Tourisme',
                'category': 'VISA',
                'description': 'Visa pour séjour touristique au Congo',
                'required_documents': 'Passeport valide\nPhotos d\'identité\nRéservation hôtel\nBillet d\'avion',
                'base_fee': 50000,
                'processing_time_days': 5,
                'requires_appointment': True,
            },
            {
                'name': 'Visa Affaires',
                'category': 'VISA',
                'description': 'Visa pour voyage d\'affaires',
                'required_documents': 'Passeport valide\nLettre d\'invitation\nPhotos d\'identité',
                'base_fee': 75000,
                'processing_time_days': 3,
                'requires_appointment': True,
            },
            # Passeports
            {
                'name': 'Passeport Nouveau',
                'category': 'PASSPORT',
                'description': 'Demande de nouveau passeport',
                'required_documents': 'Acte de naissance\nPhotos d\'identité\nCarte d\'identité',
                'base_fee': 100000,
                'processing_time_days': 10,
                'requires_appointment': True,
            },
            {
                'name': 'Renouvellement Passeport',
                'category': 'PASSPORT',
                'description': 'Renouvellement de passeport expiré',
                'required_documents': 'Ancien passeport\nPhotos d\'identité\nJustificatif de domicile',
                'base_fee': 90000,
                'processing_time_days': 7,
                'requires_appointment': True,
            },
            # Actes civils
            {
                'name': 'Acte de Naissance',
                'category': 'CIVIL',
                'description': 'Copie d\'acte de naissance',
                'required_documents': 'Pièce d\'identité des parents',
                'base_fee': 5000,
                'processing_time_days': 2,
                'requires_appointment': False,
            },
            {
                'name': 'Acte de Mariage',
                'category': 'CIVIL',
                'description': 'Copie d\'acte de mariage',
                'required_documents': 'Pièces d\'identité des époux',
                'base_fee': 5000,
                'processing_time_days': 2,
                'requires_appointment': False,
            },
            # Légalisation
            {
                'name': 'Légalisation de Documents',
                'category': 'LEGAL',
                'description': 'Légalisation de documents administratifs',
                'required_documents': 'Documents originaux à légaliser',
                'base_fee': 10000,
                'processing_time_days': 3,
                'requires_appointment': True,
            },
            # Attestations
            {
                'name': 'Attestation Consulaire',
                'category': 'ATTEST',
                'description': 'Attestation de résidence ou autre',
                'required_documents': 'Pièce d\'identité\nJustificatif de domicile',
                'base_fee': 15000,
                'processing_time_days': 1,
                'requires_appointment': True,
            },
        ]

        services = []
        for data in services_data:
            service, created = ServiceType.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            
            # Add to all offices
            service.offices.set(offices)
            services.append(service)
            
            self.stdout.write(f'  ✓ {service.name}' + (' (created)' if created else ' (exists)'))

        return services

    def create_faqs(self):
        """Create frequently asked questions"""
        faqs_data = [
            # Visa
            {
                'category': 'VISA',
                'question': 'Quel est le délai pour obtenir un visa ?',
                'answer': 'Le délai standard est de 5 jours ouvrés pour un visa tourisme et 3 jours pour un visa affaires. Des frais supplémentaires s\'appliquent pour un traitement express (24-48h).',
                'display_order': 1,
            },
            {
                'category': 'VISA',
                'question': 'Quels documents sont nécessaires pour un visa tourisme ?',
                'answer': 'Vous devez fournir : un passeport valide (minimum 6 mois), 2 photos d\'identité récentes, une réservation d\'hôtel confirmée, un billet d\'avion aller-retour, et un justificatif de ressources financières.',
                'display_order': 2,
            },
            # Passeport
            {
                'category': 'PASSPORT',
                'question': 'Combien de temps faut-il pour obtenir un passeport ?',
                'answer': 'Le délai est de 10 jours ouvrés pour un nouveau passeport et 7 jours pour un renouvellement. Un service express est disponible moyennant des frais supplémentaires.',
                'display_order': 1,
            },
            {
                'category': 'PASSPORT',
                'question': 'Que faire si mon passeport est perdu ou volé ?',
                'answer': 'Vous devez immédiatement déclarer la perte/vol à la police locale, puis prendre rendez-vous à l\'ambassade avec le récépissé de déclaration, des photos d\'identité et une pièce d\'identité si disponible.',
                'display_order': 2,
            },
            # Rendez-vous
            {
                'category': 'APPOINTMENT',
                'question': 'Comment prendre rendez-vous ?',
                'answer': 'Vous pouvez prendre rendez-vous directement en ligne sur ce site. Sélectionnez le service souhaité, choisissez une date et heure disponibles, et vous recevrez une confirmation par email avec un QR code.',
                'display_order': 1,
            },
            {
                'category': 'APPOINTMENT',
                'question': 'Puis-je annuler ou modifier mon rendez-vous ?',
                'answer': 'Oui, vous pouvez annuler ou modifier votre rendez-vous jusqu\'à 24h avant l\'heure prévue via votre espace personnel. Au-delà, veuillez contacter l\'ambassade directement.',
                'display_order': 2,
            },
            # Paiement
            {
                'category': 'PAYMENT',
                'question': 'Quels moyens de paiement sont acceptés ?',
                'answer': 'Nous acceptons les paiements par carte bancaire en ligne (Visa, Mastercard), Orange Money, Wave, et espèces au guichet de l\'ambassade.',
                'display_order': 1,
            },
            {
                'category': 'PAYMENT',
                'question': 'Est-ce que je peux obtenir un remboursement ?',
                'answer': 'Les frais consulaires ne sont généralement pas remboursables. Cependant, en cas de rejet de votre demande pour des raisons administratives indépendantes de votre volonté, un remboursement partiel peut être accordé.',
                'display_order': 2,
            },
            # Documents
            {
                'category': 'DOCUMENTS',
                'question': 'Quels formats de documents sont acceptés pour l\'upload ?',
                'answer': 'Nous acceptons les fichiers PDF, JPG et PNG. La taille maximale par fichier est de 10 MB. Assurez-vous que vos documents sont lisibles et de bonne qualité.',
                'display_order': 1,
            },
            # Général
            {
                'category': 'GENERAL',
                'question': 'Quels sont les horaires d\'ouverture de l\'ambassade ?',
                'answer': 'L\'ambassade est ouverte du lundi au vendredi de 9h à 17h, et le samedi de 9h à 13h. Fermé le dimanche et jours fériés.',
                'display_order': 1,
            },
            {
                'category': 'GENERAL',
                'question': 'Comment puis-je suivre l\'avancement de ma demande ?',
                'answer': 'Vous pouvez suivre l\'avancement de votre demande en temps réel depuis votre espace personnel. Vous recevrez également des notifications par email et SMS à chaque étape importante.',
                'display_order': 2,
            },
        ]

        for data in faqs_data:
            faq, created = FAQ.objects.get_or_create(
                question=data['question'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  ✓ {faq.question[:60]}...')

    def create_notification_templates(self):
        """Create notification templates"""
        templates_data = [
            {
                'notification_type': 'APT_CONFIRMED',
                'email_subject': 'Rendez-vous confirmé - Ambassade du Congo',
                'email_body': 'Bonjour,\n\nVotre rendez-vous a été confirmé.\n\nCordialement,\nL\'équipe consulaire',
                'sms_body': 'Votre RDV à l\'Ambassade du Congo est confirmé. Réf: {{reference}}',
                'push_title': 'Rendez-vous confirmé',
                'push_body': 'Votre rendez-vous a été confirmé',
                'send_email': True,
                'send_sms': True,
                'send_push': True,
            },
            {
                'notification_type': 'APP_RECEIVED',
                'email_subject': 'Demande reçue - Ambassade du Congo',
                'email_body': 'Bonjour,\n\nNous avons bien reçu votre demande.\n\nCordialement,\nL\'équipe consulaire',
                'push_title': 'Demande reçue',
                'push_body': 'Votre demande a été enregistrée',
                'send_email': True,
                'send_push': True,
            },
            {
                'notification_type': 'PAY_RECEIVED',
                'email_subject': 'Paiement reçu - Ambassade du Congo',
                'email_body': 'Bonjour,\n\nNous avons reçu votre paiement.\n\nCordialement,\nL\'équipe consulaire',
                'push_title': 'Paiement confirmé',
                'push_body': 'Votre paiement a été reçu',
                'send_email': True,
                'send_push': True,
            },
        ]

        for data in templates_data:
            template, created = NotificationTemplate.objects.get_or_create(
                notification_type=data['notification_type'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  ✓ {template.get_notification_type_display()}')

