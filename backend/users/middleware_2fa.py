"""
Middleware pour forcer la 2FA pour les admins et super admins dans Django Admin
"""
from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.auth import logout
from django.utils.deprecation import MiddlewareMixin
from django_otp import user_has_device
from django_otp.decorators import otp_required
from django_otp.middleware import OTPMiddleware


class Admin2FAMiddleware(MiddlewareMixin):
    """
    Middleware qui force la vérification 2FA pour les admins et super admins
    avant d'accéder à Django Admin
    """
    
    def process_request(self, request):
        # Ne s'applique qu'aux URLs de l'admin
        if not request.path.startswith('/admin/'):
            return None
        
        # Ignorer les URLs de login, logout, et les URLs de 2FA
        excluded_paths = [
            '/admin/login/',
            '/admin/logout/',
            '/admin/setup-2fa/',
            '/admin/verify-2fa/',
            '/admin/disable-2fa/',
            '/admin/login/verify-2fa/',  # Vérification 2FA lors du login
        ]
        
        if any(request.path.startswith(path) for path in excluded_paths):
            return None
        
        # Vérifier si l'utilisateur est authentifié
        if not request.user.is_authenticated:
            return None
        
        # Vérifier si l'utilisateur est staff (admin)
        if not request.user.is_staff:
            return None
        
        # Vérifier si l'utilisateur nécessite la 2FA
        from .models import User
        user = request.user
        
        # S'assurer que l'utilisateur est une instance de notre modèle User
        if not isinstance(user, User):
            return None
        
        if user.role not in ['ADMIN', 'SUPERADMIN']:
            return None
        
        # Vérifier si l'utilisateur a un appareil TOTP configuré
        if not user_has_device(user):
            # Rediriger vers la page de configuration 2FA
            if request.path != '/admin/setup-2fa/':
                return redirect('admin:setup_2fa')
            return None
        
        # Vérifier si l'utilisateur a vérifié la 2FA dans cette session
        # django_otp ajoute la méthode is_verified() via le middleware OTPMiddleware
        if hasattr(request.user, 'is_verified') and not request.user.is_verified():
            # Rediriger vers la page de vérification 2FA
            if request.path not in ['/admin/verify-2fa/', '/admin/setup-2fa/']:
                return redirect('admin:verify_2fa')
            return None
        
        return None

