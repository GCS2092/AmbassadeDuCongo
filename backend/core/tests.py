"""
Tests for Core app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import ConsularOffice, ServiceType, Announcement, FAQ

User = get_user_model()


class ConsularOfficeModelTest(TestCase):
    """Test ConsularOffice model"""

    def setUp(self):
        self.office = ConsularOffice.objects.create(
            name="Test Embassy",
            office_type="EMBASSY",
            address_line1="123 Test Street",
            city="Dakar",
            country="Sénégal",
            phone_primary="+221123456789",
            email="test@embassy.com",
            latitude=14.7167,
            longitude=-17.4677,
        )

    def test_office_creation(self):
        """Test office is created correctly"""
        self.assertEqual(self.office.name, "Test Embassy")
        self.assertEqual(self.office.office_type, "EMBASSY")
        self.assertTrue(self.office.is_active)

    def test_full_address_property(self):
        """Test full_address property"""
        expected = "123 Test Street, Dakar, Sénégal"
        self.assertIn("123 Test Street", self.office.full_address)
        self.assertIn("Dakar", self.office.full_address)


class ServiceTypeModelTest(TestCase):
    """Test ServiceType model"""

    def setUp(self):
        self.office = ConsularOffice.objects.create(
            name="Test Embassy",
            office_type="EMBASSY",
            address_line1="123 Test Street",
            city="Dakar",
            country="Sénégal",
            phone_primary="+221123456789",
            email="test@embassy.com",
        )

        self.service = ServiceType.objects.create(
            name="Test Visa",
            category="VISA",
            description="Test visa service",
            base_fee=50000,
            processing_time_days=5,
            requires_appointment=True,
        )
        self.service.offices.add(self.office)

    def test_service_creation(self):
        """Test service is created correctly"""
        self.assertEqual(self.service.name, "Test Visa")
        self.assertEqual(self.service.category, "VISA")
        self.assertEqual(self.service.base_fee, 50000)
        self.assertTrue(self.service.requires_appointment)

    def test_service_office_relationship(self):
        """Test service-office relationship"""
        self.assertIn(self.office, self.service.offices.all())


class FAQModelTest(TestCase):
    """Test FAQ model"""

    def setUp(self):
        self.faq = FAQ.objects.create(
            category="VISA",
            question="How long does it take?",
            answer="5 business days",
            display_order=1,
            is_published=True,
        )

    def test_faq_creation(self):
        """Test FAQ is created correctly"""
        self.assertEqual(self.faq.category, "VISA")
        self.assertEqual(self.faq.question, "How long does it take?")
        self.assertTrue(self.faq.is_published)

    def test_faq_string_representation(self):
        """Test FAQ __str__ method"""
        self.assertIn("VISA", str(self.faq))
        self.assertIn("How long", str(self.faq))

