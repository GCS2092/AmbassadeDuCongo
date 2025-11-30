"""
Django settings for embassy_backend project.
PWA for Congo Embassy in Senegal - Secure & Production-Ready
"""

import os
from pathlib import Path
from decouple import config, Csv
from datetime import timedelta

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Security Settings
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')
DEBUG = config('DEBUG', default=False, cast=bool)

# ALLOWED_HOSTS - Sécurité renforcée
if DEBUG:
    # En développement, limiter aux IPs locales spécifiques
    ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,192.168.1.2', cast=Csv())
else:
    # En production, strictement limiter aux domaines autorisés
    ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())
    if not ALLOWED_HOSTS:
        raise ValueError("ALLOWED_HOSTS doit être défini en production")

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'django_otp',
    'django_otp.plugins.otp_totp',
    'axes',  # Brute force protection
    'csp',
    # 'django_permissions_policy',  # Permissions Policy headers - middleware non disponible dans cette version
    # 'session_security',  # Session timeout (désactivé - incompatible avec Django 4.2)
    # 'dbbackup',  # Database backups (décommenter si nécessaire)
    'storages',
    'django_q',
    
    # Local apps
    'users',
    'core',
    'appointments',
    'applications',
    'payments',
    'notifications',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        # 'session_security.middleware.SessionSecurityMiddleware',  # Désactivé - incompatible avec Django 4.2
    'django_otp.middleware.OTPMiddleware',
    'allauth.account.middleware.AccountMiddleware',  # Required by allauth
    'axes.middleware.AxesMiddleware',  # Brute force protection
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'csp.middleware.CSPMiddleware',
    # 'django_permissions_policy.middleware.PermissionsPolicyMiddleware',  # Permissions Policy headers - middleware non disponible dans cette version
    'core.middleware.AuditLogMiddleware',  # Audit logging
    'core.middleware.SecurityHeadersMiddleware',  # Additional security headers
]

ROOT_URLCONF = 'embassy_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'embassy_backend.wsgi.application'

# Database
# Use SQLite for development if USE_SQLITE is True
USE_SQLITE = config('USE_SQLITE', default=False, cast=bool)

if USE_SQLITE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='embassy_db'),
            'USER': config('DB_USER', default='embassy_user'),
            'PASSWORD': config('DB_PASSWORD', default='password'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 12}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Dakar'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Use AWS S3 for production if configured
USE_S3 = config('USE_S3', default=False, cast=bool)
if USE_S3:
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    AWS_DEFAULT_ACL = 'private'
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Authentication Backends - Inclure Axes pour la protection brute force
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',  # Backend Axes (doit être en premier)
    'django.contrib.auth.backends.ModelBackend',  # Backend Django par défaut
]

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '50/hour',  # Réduit pour sécurité
        'user': '500/hour',  # Réduit pour sécurité
        'login': '5/hour',  # Limite connexions
        'password_reset': '3/hour',  # Limite reset mot de passe
        'register': '3/hour',  # Limite inscriptions
        'email_verification': '5/hour',  # Limite vérifications email
    },
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Settings - Sécurité renforcée
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.2:3000', cast=Csv())
CORS_ALLOW_CREDENTIALS = True
# CORS_ALLOW_ALL_ORIGINS - Activé pour tests mobiles (désactiver en production)
CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=True, cast=bool)  # True pour tests mobiles
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CSRF Settings - Sécurité renforcée
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.2:3000', cast=Csv())

# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SAMESITE = 'Strict'

# Session Security - Timeout et gestion
SESSION_COOKIE_AGE = 1800  # 30 minutes d'inactivité
SESSION_EXPIRE_AT_BROWSER_CLOSE = True  # Fermer session à la fermeture du navigateur
SESSION_SAVE_EVERY_REQUEST = True  # Renouveler session à chaque requête (pour prolonger l'expiration)

# Note: django-session-security a été désactivé car incompatible avec Django 4.2
# Les paramètres de session Django natifs ci-dessus fournissent une sécurité suffisante

# Content Security Policy
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", 'https://js.stripe.com')
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", 'data:', 'https:')
CSP_FONT_SRC = ("'self'", 'data:')
CSP_CONNECT_SRC = ("'self'", 'https://api.stripe.com')
CSP_FRAME_SRC = ("'self'", 'https://js.stripe.com')

# Django Axes (Brute Force Protection) - Renforcé
AXES_FAILURE_LIMIT = 5  # 5 tentatives avant blocage
AXES_COOLOFF_TIME = 1  # 1 heure de blocage
AXES_LOCKOUT_PARAMETERS = ['username', 'ip_address']  # Nouvelle syntaxe (remplace AXES_LOCK_OUT_BY_COMBINATION_USER_AND_IP)
AXES_ENABLE_ADMIN = True  # Interface admin pour débloquer
AXES_RESET_ON_SUCCESS = True  # Réinitialiser compteur après succès
AXES_LOCKOUT_TEMPLATE = None  # Utiliser la réponse JSON par défaut
AXES_VERBOSE = True  # Logs détaillés
AXES_IP_WHITELIST = []  # IPs à ne jamais bloquer

# Email Configuration - Support both EMAIL_* and MAIL_* variables
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('MAIL_HOST', default=config('EMAIL_HOST', default='smtp.gmail.com'))
EMAIL_PORT = config('MAIL_PORT', default=config('EMAIL_PORT', default=587, cast=int), cast=int)
# MAIL_ENCRYPTION peut être 'tls' ou 'ssl'
mail_encryption = config('MAIL_ENCRYPTION', default=None)
if mail_encryption:
    EMAIL_USE_TLS = mail_encryption.lower() == 'tls'
    EMAIL_USE_SSL = mail_encryption.lower() == 'ssl'
else:
    EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
    EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_HOST_USER = config('MAIL_USERNAME', default=config('EMAIL_HOST_USER', default='slovengama@gmail.com'))
EMAIL_HOST_PASSWORD = config('MAIL_PASSWORD', default=config('EMAIL_HOST_PASSWORD', default=''))
DEFAULT_FROM_EMAIL = config('MAIL_FROM_ADDRESS', default=config('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER))
DEFAULT_FROM_NAME = config('MAIL_FROM_NAME', default='Ambassade du Congo')

# Django-Q (Async Tasks)
Q_CLUSTER = {
    'name': 'embassy_tasks',
    'workers': 4,
    'recycle': 500,
    'timeout': 60,
    'compress': True,
    'save_limit': 250,
    'queue_limit': 500,
    'cpu_affinity': 1,
    'label': 'Django Q',
    'orm': 'default',  # Use database as broker (no Redis needed)
}

# Stripe Payment
STRIPE_PUBLIC_KEY = config('STRIPE_PUBLIC_KEY', default='')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# File Upload Settings
MAX_UPLOAD_SIZE = config('MAX_UPLOAD_SIZE', default=10485760, cast=int)  # 10MB
ALLOWED_DOCUMENT_TYPES = config('ALLOWED_DOCUMENT_TYPES', default='pdf,jpg,jpeg,png', cast=Csv())

# Application Settings
APPOINTMENT_SLOT_DURATION = config('APPOINTMENT_SLOT_DURATION', default=30, cast=int)
MAX_APPOINTMENTS_PER_DAY = config('MAX_APPOINTMENTS_PER_DAY', default=50, cast=int)

# Sentry (Monitoring)
SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN and not DEBUG:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=1.0,
        send_default_pii=True
    )

# Django Sites Framework
SITE_ID = 1

# Database Backup Configuration (Optionnel - décommenter 'dbbackup' dans INSTALLED_APPS si nécessaire)
# DBBACKUP_STORAGE = 'django.core.files.storage.FileSystemStorage'
# DBBACKUP_STORAGE_OPTIONS = {
#     'location': BASE_DIR / 'backups',
# }
# DBBACKUP_CLEANUP_KEEP = 30  # Garder 30 jours de sauvegardes
# DBBACKUP_CLEANUP_KEEP_MEDIA = 30  # Garder 30 jours de médias
# DBBACKUP_CONNECTOR_SETTINGS = {
#     'gzip': True,  # Compresser les sauvegardes
# }

# Encryption Key for sensitive data (DOIT être dans .env)
ENCRYPTION_KEY = config('ENCRYPTION_KEY', default='')
if not ENCRYPTION_KEY and not DEBUG:
    raise ValueError("ENCRYPTION_KEY doit être défini en production")

# Permissions Policy (Feature Policy) - Headers de sécurité
# Contrôle quelles fonctionnalités du navigateur peuvent être utilisées
PERMISSIONS_POLICY = {
    'accelerometer': [],  # Désactiver accéléromètre
    'ambient-light-sensor': [],  # Désactiver capteur de lumière
    'autoplay': [],  # Désactiver autoplay
    'camera': [],  # Désactiver caméra
    'display-capture': [],  # Désactiver capture d'écran
    'document-domain': [],  # Désactiver document.domain
    'encrypted-media': [],  # Désactiver média chiffré
    'fullscreen': ['self'],  # Autoriser fullscreen uniquement pour le même origine
    'geolocation': [],  # Désactiver géolocalisation
    'gyroscope': [],  # Désactiver gyroscope
    'magnetometer': [],  # Désactiver magnétomètre
    'microphone': [],  # Désactiver microphone
    'midi': [],  # Désactiver MIDI
    'payment': [],  # Désactiver Payment Request API
    'picture-in-picture': ['self'],  # Autoriser PiP uniquement pour le même origine
    'publickey-credentials-get': [],  # Désactiver WebAuthn
    'screen-wake-lock': [],  # Désactiver Screen Wake Lock
    'sync-xhr': [],  # Désactiver XMLHttpRequest synchrone
    'usb': [],  # Désactiver WebUSB
    'web-share': ['self'],  # Autoriser Web Share uniquement pour le même origine
    'xr-spatial-tracking': [],  # Désactiver WebXR
}

# Logging - Amélioré pour sécurité
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'security': {
            'format': 'SECURITY {asctime} {levelname} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'formatter': 'security',
        },
        'axes_file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'axes.log',
            'formatter': 'security',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'axes': {
            'handlers': ['axes_file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'embassy': {
            'handlers': ['file', 'security_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'embassy': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# Hashids configuration for obfuscating IDs in URLs
HASHIDS_SALT = config('HASHIDS_SALT', default='your-super-secret-salt-for-hashids-change-this-in-production')
HASHIDS_MIN_LENGTH = config('HASHIDS_MIN_LENGTH', default=8, cast=int)

# Encryption Key for sensitive data (Fernet symmetric encryption)
# IMPORTANT: Generate a key with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Store this in .env file and NEVER commit it to version control
ENCRYPTION_KEY = config('ENCRYPTION_KEY', default=None)
if not ENCRYPTION_KEY and not DEBUG:
    raise ValueError("ENCRYPTION_KEY must be set in production environment variables!")

