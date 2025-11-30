"""
Configuration Django pour la production avec HTTPS
"""
import os
from .settings import *

# Configuration HTTPS Production
SECURE_SSL_REDIRECT = True  # Rediriger HTTP vers HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000  # 1 an
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS pour production
CORS_ALLOWED_ORIGINS = [
    "https://ambassade-congo.sn",
    "https://www.ambassade-congo.sn",
    "https://app.ambassade-congo.sn",
]

# Headers de sécurité renforcés
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Cookies sécurisés
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

# Debug désactivé en production
DEBUG = False

# Allowed hosts pour production
ALLOWED_HOSTS = [
    'ambassade-congo.sn',
    'www.ambassade-congo.sn',
    'app.ambassade-congo.sn',
    'localhost',  # Pour les tests locaux
    '127.0.0.1',
]

# Configuration de base de données production (PostgreSQL recommandé)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'embassy_prod'),
        'USER': os.environ.get('DB_USER', 'embassy_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Configuration des médias et fichiers statiques
STATIC_ROOT = '/var/www/embassade-congo/static/'
MEDIA_ROOT = '/var/www/embassade-congo/media/'

# Configuration des logs
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/embassade-congo/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

print("🏭 [Production Settings] Configuration production chargée")
print(f"🏭 [Production Settings] Allowed hosts: {ALLOWED_HOSTS}")
print(f"🏭 [Production Settings] CORS origins: {CORS_ALLOWED_ORIGINS}")
