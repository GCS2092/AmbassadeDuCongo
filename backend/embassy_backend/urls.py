"""
URL configuration for embassy_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers

# API Router
router = routers.DefaultRouter()

urlpatterns = [
    path('admin/', admin.site.urls),
    # Redirection pour site-settings (URL simplifiée)
    path('admin/site-settings', RedirectView.as_view(url='/admin/core/sitesettings/', permanent=False), name='site-settings-redirect'),
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

