"""
Tests for Payments app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Payment, Refund
from applications.models import Application
from core.models import ConsularOffice, ServiceType

User = get_user_model()


class PaymentModelTest(TestCase):
    """Test Payment model"""

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
            name="Test Service",
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

        self.payment = Payment.objects.create(
            application=self.application,
            user=self.user,
            amount=50000,
            payment_method='STRIPE',
        )

    def test_payment_creation(self):
        """Test payment is created"""
        self.assertIsNotNone(self.payment.transaction_id)
        self.assertTrue(self.payment.transaction_id.startswith('TXN-'))
        self.assertEqual(self.payment.status, 'PENDING')

    def test_receipt_number_generation(self):
        """Test receipt number is generated when completed"""
        self.assertIsNone(self.payment.receipt_number)
        
        self.payment.status = 'COMPLETED'
        self.payment.save()
        
        self.assertIsNotNone(self.payment.receipt_number)
        self.assertTrue(self.payment.receipt_number.startswith('RCP-'))

    def test_is_successful(self):
        """Test is_successful property"""
        self.assertFalse(self.payment.is_successful)
        
        self.payment.status = 'COMPLETED'
        self.assertFalse(self.payment.is_successful)  # Still False because not saved
        
        self.payment.save()
        # Create new instance from DB
        payment = Payment.objects.get(id=self.payment.id)
        self.assertTrue(payment.is_successful)


class RefundModelTest(TestCase):
    """Test Refund model"""

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
            name="Test Service",
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

        self.payment = Payment.objects.create(
            application=self.application,
            user=self.user,
            amount=50000,
            payment_method='STRIPE',
            status='COMPLETED',
        )

        self.refund = Refund.objects.create(
            payment=self.payment,
            amount=50000,
            reason="Test refund",
            requested_by=self.user,
        )

    def test_refund_creation(self):
        """Test refund is created"""
        self.assertIsNotNone(self.refund.refund_id)
        self.assertTrue(self.refund.refund_id.startswith('RFD-'))
        self.assertEqual(self.refund.status, 'PENDING')

    def test_refund_string_representation(self):
        """Test __str__ method"""
        self.assertIn('XOF', str(self.refund))

