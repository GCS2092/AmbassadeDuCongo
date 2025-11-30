"""
Tests for Users app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()


class UserModelTest(TestCase):
    """Test User model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )

    def test_user_creation(self):
        """Test user is created correctly"""
        self.assertEqual(self.user.email, "test@example.com")
        self.assertEqual(self.user.role, "CITIZEN")
        self.assertFalse(self.user.is_verified)

    def test_user_full_name(self):
        """Test get_full_name method"""
        self.assertEqual(self.user.get_full_name(), "Test User")

    def test_is_staff_member(self):
        """Test staff member role"""
        self.assertFalse(self.user.role in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE'])
        
        self.user.role = "AGENT_CONSULAIRE"
        self.user.save()
        self.assertTrue(self.user.role in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE'])

    def test_profile_auto_created(self):
        """Test profile is auto-created with user"""
        self.assertTrue(hasattr(self.user, 'profile'))
        self.assertIsInstance(self.user.profile, Profile)


class ProfileModelTest(TestCase):
    """Test Profile model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.profile = self.user.profile

    def test_profile_creation(self):
        """Test profile exists for user"""
        self.assertIsNotNone(self.profile)
        self.assertEqual(self.profile.user, self.user)

    def test_profile_defaults(self):
        """Test profile default values"""
        self.assertFalse(self.profile.documents_complete)
        self.assertEqual(self.profile.nationality, "CG")

    def test_is_profile_complete(self):
        """Test is_profile_complete property"""
        self.assertFalse(self.profile.is_profile_complete)
        
        # Fill required fields
        self.profile.date_of_birth = "1990-01-01"
        self.profile.place_of_birth = "Brazzaville"
        self.profile.nationality = "CG"
        self.profile.address_line1 = "123 Test St"
        self.profile.city = "Dakar"
        self.profile.save()
        
        self.assertTrue(self.profile.is_profile_complete)

