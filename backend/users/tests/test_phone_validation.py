from django.test import TestCase
from users.serializers import UserRegistrationSerializer

class PhoneValidationTests(TestCase):
    def test_rejects_too_long_phone(self):
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'Str0ngP@ssw0rd!',
            'password_confirm': 'Str0ngP@ssw0rd!',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '1'*100  # too long in clear text
        }
        s = UserRegistrationSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('phone_number', s.errors)

    def test_accepts_valid_phone(self):
        data = {
            'username': 'testuser2',
            'email': 'test2@example.com',
            'password': 'Str0ngP@ssw0rd!',
            'password_confirm': 'Str0ngP@ssw0rd!',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+221771234567'
        }
        s = UserRegistrationSerializer(data=data)
        self.assertTrue(s.is_valid(), s.errors)