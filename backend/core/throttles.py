"""
Custom throttle classes for enhanced security
"""
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class LoginRateThrottle(UserRateThrottle):
    """Throttle pour les tentatives de connexion"""
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    """Throttle pour les inscriptions"""
    scope = 'register'


class PasswordResetRateThrottle(AnonRateThrottle):
    """Throttle pour les réinitialisations de mot de passe"""
    scope = 'password_reset'


class EmailVerificationRateThrottle(AnonRateThrottle):
    """Throttle pour les vérifications d'email"""
    scope = 'email_verification'
    rate = '5/hour'

