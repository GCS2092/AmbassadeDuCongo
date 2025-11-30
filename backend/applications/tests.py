"""
Tests for Applications app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Document, Application
from core.models import ConsularOffice, ServiceType

User = get_user_model()


class DocumentModelTest(TestCase):
    """Test Document model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )

        # Create a simple test file
        self.test_file = SimpleUploadedFile(
            "test.pdf",
            b"file_content",
            content_type="application/pdf"
        )

        self.document = Document.objects.create(
            owner=self.user,
            document_type="PASSPORT",
            file=self.test_file,
            original_filename="test.pdf",
            file_size=len(b"file_content"),
        )

    def test_document_creation(self):
        """Test document is created"""
        self.assertEqual(self.document.owner, self.user)
        self.assertEqual(self.document.document_type, "PASSPORT")
        self.assertFalse(self.document.is_verified)

    def test_document_string_representation(self):
        """Test __str__ method"""
        self.assertIn("Passeport", str(self.document))


class ApplicationModelTest(TestCase):
    """Test Application model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )

        self.office = ConsularOffice.objects.create(
            name="Test Embassy",
            office_type="EMBASSY",
            address_line1="123 Test St",
            city="Dakar",
            country="Sénégal",
            phone_primary="+221123456789",
            email="test@embassy.com",
        )

        self.service = ServiceType.objects.create(
            name="Test Visa",
            category="VISA",
            base_fee=50000,
        )

        self.application = Application.objects.create(
            application_type="VISA",
            service_type=self.service,
            applicant=self.user,
            office=self.office,
            base_fee=50000,
        )

    def test_application_creation(self):
        """Test application is created"""
        self.assertIsNotNone(self.application.reference_number)
        self.assertTrue(self.application.reference_number.startswith('APP-'))
        self.assertEqual(self.application.status, 'DRAFT')

    def test_total_fee_calculation(self):
        """Test total fee is calculated"""
        self.assertEqual(self.application.total_fee, 50000)
        
        self.application.additional_fees = 10000
        self.application.save()
        self.assertEqual(self.application.total_fee, 60000)

    def test_can_be_cancelled(self):
        """Test can_be_cancelled property"""
        self.assertTrue(self.application.can_be_cancelled)
        
        self.application.status = 'COMPLETED'
        self.application.save()
        self.assertFalse(self.application.can_be_cancelled)

    def test_is_paid(self):
        """Test is_paid property"""
        from payments.models import Payment
        
        self.assertFalse(self.application.is_paid)
        
        payment = Payment.objects.create(
            application=self.application,
            user=self.user,
            amount=50000,
            payment_method='STRIPE',
            status='COMPLETED',
        )
        
        # Refresh from DB
        self.application.refresh_from_db()
        self.assertTrue(self.application.is_paid)

