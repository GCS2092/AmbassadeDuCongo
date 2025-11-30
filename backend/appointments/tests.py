"""
Tests for Appointments app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Appointment, AppointmentSlot
from core.models import ConsularOffice, ServiceType

User = get_user_model()


class AppointmentModelTest(TestCase):
    """Test Appointment model"""

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
            processing_time_days=5,
        )
        self.service.offices.add(self.office)

        tomorrow = timezone.now().date() + timedelta(days=1)
        self.appointment = Appointment.objects.create(
            user=self.user,
            office=self.office,
            service_type=self.service,
            appointment_date=tomorrow,
            appointment_time="10:00",
        )

    def test_appointment_creation(self):
        """Test appointment is created correctly"""
        self.assertIsNotNone(self.appointment.reference_number)
        self.assertTrue(self.appointment.reference_number.startswith('APT-'))
        self.assertEqual(self.appointment.status, 'PENDING')

    def test_qr_code_generation(self):
        """Test QR code is generated"""
        self.assertIsNotNone(self.appointment.qr_code)

    def test_can_be_cancelled(self):
        """Test can_be_cancelled property"""
        self.assertTrue(self.appointment.can_be_cancelled)
        
        self.appointment.status = 'COMPLETED'
        self.appointment.save()
        self.assertFalse(self.appointment.can_be_cancelled)


class AppointmentSlotTest(TestCase):
    """Test AppointmentSlot model"""

    def setUp(self):
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
        )

        tomorrow = timezone.now().date() + timedelta(days=1)
        self.slot = AppointmentSlot.objects.create(
            office=self.office,
            service_type=self.service,
            date=tomorrow,
            start_time="10:00",
            end_time="10:30",
            max_appointments=2,
        )

    def test_slot_creation(self):
        """Test slot is created"""
        self.assertTrue(self.slot.is_available)
        self.assertEqual(self.slot.max_appointments, 2)

    def test_appointments_count(self):
        """Test appointments count"""
        self.assertEqual(self.slot.appointments_count, 0)

    def test_is_full(self):
        """Test is_full property"""
        self.assertFalse(self.slot.is_full)

