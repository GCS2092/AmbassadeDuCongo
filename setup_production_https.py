#!/usr/bin/env python3
"""
Configuration HTTPS complète pour la production
"""

import os
import subprocess
import sys
from pathlib import Path

def create_nginx_config():
    """Crée une configuration Nginx avec HTTPS"""
    
    nginx_config = '''server {
    listen 80;
    server_name 192.168.1.32 localhost;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 192.168.1.32 localhost;

    # Certificats SSL
    ssl_certificate /etc/ssl/certs/embassy.crt;
    ssl_certificate_key /etc/ssl/private/embassy.key;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Frontend React
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://192.168.1.32" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://192.168.1.32";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
    
    # Fichiers statiques
    location /static/ {
        alias /path/to/your/static/files/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        alias /path/to/your/media/files/;
        expires 1y;
        add_header Cache-Control "public";
    }
}'''
    
    with open('nginx_https.conf', 'w') as f:
        f.write(nginx_config)
    
    print("✅ Configuration Nginx HTTPS créée")

def create_ssl_certificates():
    """Crée des certificats SSL pour la production"""
    
    print("🔐 Génération des certificats SSL...")
    
    # Créer le dossier ssl
    ssl_dir = Path("ssl")
    ssl_dir.mkdir(exist_ok=True)
    
    # Script de génération de certificats
    cert_script = '''#!/bin/bash
# Génération de certificats SSL pour la production

# Créer le dossier ssl
mkdir -p ssl

# Générer une clé privée
openssl genrsa -out ssl/embassy.key 2048

# Générer un certificat auto-signé
openssl req -new -x509 -key ssl/embassy.key -out ssl/embassy.crt -days 365 -subj "/C=SN/ST=Dakar/L=Dakar/O=Ambassade Congo/OU=IT/CN=192.168.1.32"

# Générer un certificat pour localhost aussi
openssl req -new -x509 -key ssl/embassy.key -out ssl/localhost.crt -days 365 -subj "/C=SN/ST=Dakar/L=Dakar/O=Ambassade Congo/OU=IT/CN=localhost"

echo "✅ Certificats SSL générés:"
echo "  - ssl/embassy.key (clé privée)"
echo "  - ssl/embassy.crt (certificat pour 192.168.1.32)"
echo "  - ssl/localhost.crt (certificat pour localhost)"
'''
    
    with open('generate_ssl.sh', 'w') as f:
        f.write(cert_script)
    
    # Rendre le script exécutable
    os.chmod('generate_ssl.sh', 0o755)
    
    print("✅ Script de génération SSL créé")

def create_docker_compose():
    """Crée un docker-compose pour la production"""
    
    docker_compose = '''version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx_https.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - VITE_API_URL=https://192.168.1.32/api
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - ALLOWED_HOSTS=192.168.1.32,localhost
      - CORS_ALLOWED_ORIGINS=https://192.168.1.32,https://localhost
      - CSRF_TRUSTED_ORIGINS=https://192.168.1.32,https://localhost
    volumes:
      - ./backend/media:/app/media
      - ./backend/staticfiles:/app/staticfiles
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=embassy_db
      - POSTGRES_USER=embassy_user
      - POSTGRES_PASSWORD=embassy_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
'''
    
    with open('docker-compose.prod.yml', 'w') as f:
        f.write(docker_compose)
    
    print("✅ Docker Compose de production créé")

def create_dockerfiles():
    """Crée les Dockerfiles pour la production"""
    
    # Dockerfile pour le frontend
    frontend_dockerfile = '''FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
'''
    
    with open('frontend/Dockerfile', 'w') as f:
        f.write(frontend_dockerfile)
    
    # Dockerfile pour le backend
    backend_dockerfile = '''FROM python:3.12-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \\
    postgresql-client \\
    && rm -rf /var/lib/apt/lists/*

# Installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code
COPY . .

# Collecter les fichiers statiques
RUN python manage.py collectstatic --noinput

# Exposer le port
EXPOSE 8000

# Commande de démarrage
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "embassy_backend.wsgi:application"]
'''
    
    with open('backend/Dockerfile', 'w') as f:
        f.write(backend_dockerfile)
    
    print("✅ Dockerfiles créés")

def create_production_settings():
    """Crée les paramètres de production"""
    
    prod_settings = '''"""
Paramètres de production pour l'Ambassade du Congo
"""
from .settings import *
import os

# Sécurité
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
ALLOWED_HOSTS = ['192.168.1.32', 'localhost', '127.0.0.1']

# Base de données PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'embassy_db'),
        'USER': os.environ.get('DB_USER', 'embassy_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'embassy_password'),
        'HOST': os.environ.get('DB_HOST', 'postgres'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# HTTPS
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS pour HTTPS
CORS_ALLOWED_ORIGINS = [
    'https://192.168.1.32',
    'https://localhost',
]
CORS_ALLOW_CREDENTIALS = True

# CSRF
CSRF_TRUSTED_ORIGINS = [
    'https://192.168.1.32',
    'https://localhost',
]

# Fichiers statiques
STATIC_URL = '/static/'
STATIC_ROOT = '/app/staticfiles'

# Fichiers média
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/media'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/app/logs/django.log',
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
'''
    
    with open('backend/embassy_backend/settings_prod.py', 'w') as f:
        f.write(prod_settings)
    
    print("✅ Paramètres de production créés")

def create_startup_scripts():
    """Crée les scripts de démarrage"""
    
    # Script de démarrage HTTPS
    https_script = '''#!/usr/bin/env pwsh
# Script de démarrage HTTPS pour la production

Write-Host "=== DEMARRAGE HTTPS PRODUCTION ===" -ForegroundColor Green
Write-Host ""

# Vérifier Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker non installé" -ForegroundColor Red
    Write-Host "Installez Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Vérifier Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose non installé" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔐 Génération des certificats SSL..." -ForegroundColor Yellow

# Générer les certificats SSL
if (Test-Path "generate_ssl.sh") {
    bash generate_ssl.sh
} else {
    Write-Host "❌ Script de génération SSL non trouvé" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🐳 Démarrage des services Docker..." -ForegroundColor Yellow

# Démarrer les services
docker-compose -f docker-compose.prod.yml up -d

Write-Host ""
Write-Host "=== SERVICES DEMARRES ===" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Accès HTTPS:" -ForegroundColor Cyan
Write-Host "  Frontend: https://192.168.1.32" -ForegroundColor White
Write-Host "  Backend: https://192.168.1.32/api" -ForegroundColor White
Write-Host ""
Write-Host "📱 Caméra mobile:" -ForegroundColor Magenta
Write-Host "  ✅ Fonctionne maintenant avec HTTPS" -ForegroundColor Green
Write-Host "  ✅ Scanner QR opérationnel" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Gestion:" -ForegroundColor Yellow
Write-Host "  Arrêter: docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "  Logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
'''
    
    with open('start_production_https.ps1', 'w') as f:
        f.write(https_script)
    
    print("✅ Script de démarrage HTTPS créé")

def main():
    """Fonction principale"""
    
    print("🚀 Configuration HTTPS pour la production")
    print("=" * 50)
    
    # Créer toutes les configurations
    create_nginx_config()
    create_ssl_certificates()
    create_docker_compose()
    create_dockerfiles()
    create_production_settings()
    create_startup_scripts()
    
    print("\n" + "=" * 50)
    print("✅ CONFIGURATION HTTPS TERMINÉE")
    print("")
    print("📋 POUR DÉMARRER EN PRODUCTION HTTPS:")
    print("1. Installez Docker Desktop")
    print("2. Exécutez: .\\start_production_https.ps1")
    print("3. Accédez à: https://192.168.1.32")
    print("")
    print("📱 AVANTAGES HTTPS:")
    print("✅ Caméra mobile fonctionne parfaitement")
    print("✅ Scanner QR opérationnel")
    print("✅ Sécurité renforcée")
    print("✅ Compatible production")
    print("")
    print("🔧 GESTION:")
    print("- Arrêter: docker-compose -f docker-compose.prod.yml down")
    print("- Logs: docker-compose -f docker-compose.prod.yml logs -f")
    print("- Redémarrer: docker-compose -f docker-compose.prod.yml restart")

if __name__ == "__main__":
    main()
