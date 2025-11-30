"""
URL configuration for User API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserRegistrationView, UserLoginView, ProfileView, user_info,
    verify_email, resend_verification_code, document_reminders,
    UserDocumentViewSet, update_reminder_status, UserViewSet
)

app_name = 'users'

# Router principal
router = DefaultRouter()
router.register(r'documents', UserDocumentViewSet, basename='user-documents')
router.register(r'users', UserViewSet, basename='user')  # Remplace AdminUserListView

urlpatterns = [
    # Authentication
    path('login/', UserLoginView.as_view(), name='login'),
    path('token/obtain/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    
    # Email verification
    path('verify-email/', verify_email, name='verify_email'),
    path('resend-code/', resend_verification_code, name='resend_code'),
    
    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    path('user-info/', user_info, name='user_info'),
    path('document-reminders/', document_reminders, name='document_reminders'),
    path('document-reminders/<str:reminder_id>/status/', update_reminder_status, name='update_reminder_status'),
    
    # Inclure les routes du router (documents + utilisateurs)
    path('', include(router.urls)),
]
