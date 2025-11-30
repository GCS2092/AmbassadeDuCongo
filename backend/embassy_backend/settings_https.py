"""
Configuration Django pour HTTPS
"""
import os
from .settings import *

# HTTPS Configuration
SECURE_SSL_REDIRECT = False  # Désactivé pour le développement
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 0  # Désactivé pour le développement
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# CORS pour HTTPS
CORS_ALLOWED_ORIGINS = [
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "https://0.0.0.0:3000",
]

# Ajouter l'IP locale pour l'accès mobile
import socket
try:
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    CORS_ALLOWED_ORIGINS.append(f"https://{local_ip}:3000")
except:
    pass

# Headers de sécurité
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Session sécurisée
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Debug activé pour le développement HTTPS
DEBUG = True

# Allowed hosts pour HTTPS
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '192.168.1.100',  # IP locale - à adapter selon votre réseau
    '192.168.0.100',  # IP locale alternative
]

# Ajouter l'IP locale automatiquement
try:
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    if local_ip not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(local_ip)
except:
    pass

print(f"🔧 [HTTPS Settings] Allowed hosts: {ALLOWED_HOSTS}")
print(f"🔧 [HTTPS Settings] CORS origins: {CORS_ALLOWED_ORIGINS}")
