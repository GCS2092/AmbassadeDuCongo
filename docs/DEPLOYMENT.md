# 📘 Guide de Déploiement

Guide complet pour déployer la PWA Ambassade du Congo sur un serveur Ubuntu.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation Système](#installation-système)
3. [Configuration PostgreSQL](#configuration-postgresql)
4. [Configuration Backend Django](#configuration-backend-django)
5. [Configuration Frontend React](#configuration-frontend-react)
6. [Configuration Nginx](#configuration-nginx)
7. [Configuration SSL](#configuration-ssl)
8. [Services systemd](#services-systemd)
9. [Vérifications](#vérifications)
10. [Dépannage](#dépannage)

## Prérequis

- Serveur Ubuntu 20.04+ ou Debian 11+
- Accès root via SSH
- Domaine pointant vers le serveur
- Minimum 2GB RAM, 20GB disque
- Python 3.11+
- Node.js 18+

## Installation Système

### 1. Mise à jour du système
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Installation des paquets requis
```bash
sudo apt install -y \
    python3 python3-pip python3-venv \
    postgresql postgresql-contrib \
    nginx \
    certbot python3-certbot-nginx \
    nodejs npm \
    git curl supervisor
```

### 3. Création de l'utilisateur webapp
```bash
sudo useradd -m -s /bin/bash webapp
sudo usermod -aG www-data webapp
```

## Configuration PostgreSQL

### 1. Créer la base de données
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE embassy_db;
CREATE USER embassy_user WITH PASSWORD 'mot_de_passe_fort';
ALTER ROLE embassy_user SET client_encoding TO 'utf8';
ALTER ROLE embassy_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE embassy_user SET timezone TO 'Africa/Dakar';
GRANT ALL PRIVILEGES ON DATABASE embassy_db TO embassy_user;
\q
```

### 2. Configurer l'accès distant (optionnel)
Éditer `/etc/postgresql/15/main/pg_hba.conf` :
```conf
host    embassy_db    embassy_user    0.0.0.0/0    md5
```

Redémarrer PostgreSQL :
```bash
sudo systemctl restart postgresql
```

## Configuration Backend Django

### 1. Cloner le repository
```bash
cd /home/webapp
sudo -u webapp git clone https://github.com/your-org/embassy-pwa.git embassy
```

### 2. Créer l'environnement virtuel
```bash
cd /home/webapp/embassy
sudo -u webapp python3 -m venv venv
sudo -u webapp /home/webapp/embassy/venv/bin/pip install --upgrade pip
```

### 3. Installer les dépendances
```bash
cd /home/webapp/embassy/backend
sudo -u webapp /home/webapp/embassy/venv/bin/pip install -r requirements.txt
```

### 4. Configurer l'environnement
```bash
sudo -u webapp cp .env.example .env
sudo -u webapp nano .env
```

Configurer les variables :
```env
DEBUG=False
SECRET_KEY=générez-une-clé-secrète-forte
ALLOWED_HOSTS=embassy.example.tld
DB_NAME=embassy_db
DB_USER=embassy_user
DB_PASSWORD=votre_mot_de_passe
STRIPE_SECRET_KEY=sk_live_...
EMAIL_HOST_PASSWORD=sendgrid-api-key
```

### 5. Migrations et collecte des fichiers statiques
```bash
cd /home/webapp/embassy/backend
sudo -u webapp /home/webapp/embassy/venv/bin/python manage.py migrate
sudo -u webapp /home/webapp/embassy/venv/bin/python manage.py collectstatic --no-input
```

### 6. Créer le superutilisateur
```bash
sudo -u webapp /home/webapp/embassy/venv/bin/python manage.py createsuperuser
```

### 7. Charger les données initiales (optionnel)
```bash
# Créer un bureau consulaire
sudo -u webapp /home/webapp/embassy/venv/bin/python manage.py shell
```

```python
from core.models import ConsularOffice
ConsularOffice.objects.create(
    name="Ambassade du Congo - Dakar",
    office_type="EMBASSY",
    address_line1="Stèle Mermoz, Pyrotechnie",
    city="Dakar",
    postal_code="5243",
    country="Sénégal",
    latitude=14.7167,
    longitude=-17.4677,
    phone_primary="+221 824 8398",
    phone_secondary="+221 649 3117",
    email="contact@ambassade-congo.sn",
    opening_hours="Lun-Ven 9h-17h, Sam 9h-13h"
)
```

## Configuration Frontend React

### 1. Installer les dépendances
```bash
cd /home/webapp/embassy/frontend
sudo -u webapp npm install
```

### 2. Configurer l'environnement
```bash
sudo -u webapp cp .env.example .env
sudo -u webapp nano .env
```

```env
VITE_API_URL=https://embassy.example.tld/api
```

### 3. Build de production
```bash
sudo -u webapp npm run build
```

## Configuration Nginx

### 1. Copier la configuration
```bash
sudo cp /home/webapp/embassy/deployment/nginx/embassy.conf /etc/nginx/sites-available/embassy
```

### 2. Éditer avec votre domaine
```bash
sudo nano /etc/nginx/sites-available/embassy
```

Remplacer `embassy.example.tld` par votre domaine réel.

### 3. Activer le site
```bash
sudo ln -sf /etc/nginx/sites-available/embassy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Configuration SSL

### 1. Obtenir le certificat Let's Encrypt
```bash
sudo certbot --nginx -d embassy.example.tld
```

### 2. Tester le renouvellement automatique
```bash
sudo certbot renew --dry-run
```

## Services systemd

### 1. Copier les fichiers de service
```bash
sudo cp /home/webapp/embassy/deployment/systemd/gunicorn.socket /etc/systemd/system/
sudo cp /home/webapp/embassy/deployment/systemd/gunicorn.service /etc/systemd/system/
sudo cp /home/webapp/embassy/deployment/systemd/django-q.service /etc/systemd/system/
```

### 2. Créer le répertoire de logs
```bash
sudo mkdir -p /var/log/gunicorn
sudo chown webapp:www-data /var/log/gunicorn
```

### 3. Activer et démarrer les services
```bash
sudo systemctl daemon-reload
sudo systemctl enable gunicorn.socket
sudo systemctl enable gunicorn.service
sudo systemctl enable django-q.service
sudo systemctl start gunicorn.socket
sudo systemctl start gunicorn.service
sudo systemctl start django-q.service
```

## Vérifications

### 1. Vérifier les services
```bash
sudo systemctl status gunicorn
sudo systemctl status django-q
sudo systemctl status nginx
```

### 2. Vérifier les logs
```bash
# Gunicorn
tail -f /var/log/gunicorn/error.log

# Django-Q
sudo journalctl -u django-q -f

# Nginx
tail -f /var/log/nginx/embassy_error.log
```

### 3. Tester l'application
```bash
# API
curl https://embassy.example.tld/api/core/offices/

# Frontend
curl https://embassy.example.tld
```

## Backups

### 1. Configurer les backups automatiques
```bash
chmod +x /home/webapp/embassy/deployment/scripts/backup.sh

# Ajouter au crontab
sudo -u webapp crontab -e
```

Ajouter :
```cron
0 2 * * * /home/webapp/embassy/deployment/scripts/backup.sh
```

### 2. Tester le backup
```bash
sudo -u webapp /home/webapp/embassy/deployment/scripts/backup.sh
ls -lh /home/webapp/backups/
```

## Firewall

### Configurer UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## Monitoring

### 1. Installer Fail2ban (optionnel)
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Configurer les alertes
Éditer `/etc/fail2ban/jail.local` pour recevoir des emails en cas d'attaque.

## Dépannage

### Gunicorn ne démarre pas
```bash
# Vérifier les permissions
ls -la /run/gunicorn.sock

# Vérifier la configuration
sudo systemctl status gunicorn
sudo journalctl -u gunicorn -n 50
```

### Django-Q ne traite pas les tâches
```bash
# Vérifier le service
sudo systemctl status django-q

# Voir les logs
sudo journalctl -u django-q -f

# Redémarrer
sudo systemctl restart django-q
```

### Erreur 502 Bad Gateway
```bash
# Vérifier que Gunicorn tourne
sudo systemctl status gunicorn

# Vérifier la socket
ls -la /run/gunicorn.sock

# Vérifier les logs Nginx
tail -f /var/log/nginx/embassy_error.log
```

### Base de données inaccessible
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Tester la connexion
psql -h localhost -U embassy_user -d embassy_db
```

## Mises à jour

### Mettre à jour l'application
```bash
cd /home/webapp/embassy
sudo -u webapp git pull origin main
sudo -u webapp /home/webapp/embassy/deployment/scripts/deploy.sh
```

---

✅ **Félicitations !** Votre PWA Ambassade est maintenant déployée.

📊 Accédez à :
- **Application** : https://embassy.example.tld
- **Admin** : https://embassy.example.tld/admin

