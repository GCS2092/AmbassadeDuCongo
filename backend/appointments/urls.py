"""
URL configuration for Appointments API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, AppointmentSlotViewSet

app_name = 'appointments'

router = DefaultRouter()
router.register(r'', AppointmentViewSet, basename='appointment')
router.register(r'slots', AppointmentSlotViewSet, basename='slot')

urlpatterns = [
    path('', include(router.urls)),
]

