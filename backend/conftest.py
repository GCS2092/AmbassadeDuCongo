"""
Pytest configuration and fixtures
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def user(db):
    """Create a test user"""
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    return User.objects.create_user(
        username="admin",
        email="admin@example.com",
        password="adminpass123",
        role="ADMIN",
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def consular_office(db):
    """Create a consular office"""
    from core.models import ConsularOffice
    return ConsularOffice.objects.create(
        name="Test Embassy",
        office_type="EMBASSY",
        address_line1="123 Test Street",
        city="Dakar",
        country="Sénégal",
        phone_primary="+221123456789",
        email="test@embassy.com",
    )


@pytest.fixture
def service_type(db, consular_office):
    """Create a service type"""
    from core.models import ServiceType
    service = ServiceType.objects.create(
        name="Test Visa",
        category="VISA",
        base_fee=50000,
        processing_time_days=5,
    )
    service.offices.add(consular_office)
    return service

