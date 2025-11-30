"""
URL configuration for Core API with export endpoints
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConsularOfficeViewSet, ServiceTypeViewSet, 
    AnnouncementViewSet, FAQViewSet, AdminExportViewSet, VigileStatisticsViewSet, QRCodeScanViewSet,
    AuditLogViewSet, SiteSettingsViewSet
)
from .api_views import FeedbackViewSet

app_name = 'core'

router = DefaultRouter()
router.register(r'consular-offices', ConsularOfficeViewSet, basename='consular-office')
router.register(r'service-types', ServiceTypeViewSet, basename='service-type')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'faq', FAQViewSet, basename='faq')
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'admin/exports', AdminExportViewSet, basename='admin-exports')
router.register(r'vigile/stats', VigileStatisticsViewSet, basename='vigile-stats')
router.register(r'vigile/qr-scan', QRCodeScanViewSet, basename='qr-scan')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'site-settings', SiteSettingsViewSet, basename='site-settings')

urlpatterns = [
    path('', include(router.urls)),
]
