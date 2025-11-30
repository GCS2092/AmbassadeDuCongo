"""
URL configuration for embassy_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from users.admin_2fa import Setup2FAView, Verify2FAView, Disable2FAView
from users.admin_login import AdminLoginView, AdminLoginVerify2FAView

# API Router
router = routers.DefaultRouter()

urlpatterns = [
    # Remplacer la vue de login par défaut par notre vue personnalisée
    path('admin/login/', AdminLoginView.as_view(), name='admin:login'),
    path('admin/login/verify-2fa/', AdminLoginVerify2FAView.as_view(), name='admin:login_verify_2fa'),
    path('admin/', admin.site.urls),
    # Redirection pour site-settings (URL simplifiée)
    path('admin/site-settings', RedirectView.as_view(url='/admin/core/sitesettings/', permanent=False), name='site-settings-redirect'),
    # URLs pour la 2FA dans l'admin
    path('admin/setup-2fa/', Setup2FAView.as_view(), name='admin:setup_2fa'),
    path('admin/verify-2fa/', Verify2FAView.as_view(), name='admin:verify_2fa'),
    path('admin/disable-2fa/', Disable2FAView.as_view(), name='admin:disable_2fa'),
    path('api/', include(router.urls)),
    path('api/auth/', include('users.urls')),
    path('api/core/', include('core.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/applications/', include('applications.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/notifications/', include('notifications.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Customize admin site
admin.site.site_header = "Ambassade du Congo - Administration"
admin.site.site_title = "Ambassade Admin"
admin.site.index_title = "Gestion Consulaire"

