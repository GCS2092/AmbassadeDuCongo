"""
URLs pour les notifications
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('send-appointment-qr/', views.SendAppointmentQRView.as_view(), name='send-appointment-qr'),
    path('generate-qr-code/', views.GenerateQRCodeView.as_view(), name='generate-qr-code'),
    path('send-user-qr/', views.SendUserQRView.as_view(), name='send-user-qr'),
    path('', include(router.urls)),
]