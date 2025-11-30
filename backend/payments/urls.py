"""
URL configuration for Payments API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, RefundViewSet
from .webhooks import stripe_webhook

app_name = 'payments'

router = DefaultRouter()
router.register(r'', PaymentViewSet, basename='payment')
router.register(r'refunds', RefundViewSet, basename='refund')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
]

