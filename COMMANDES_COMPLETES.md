# Commandes Complètes - Ambassade du Congo

## 🚀 Démarrage du Projet

### 1. Démarrage Simple (HTTP)
```powershell
# Démarrer les serveurs en mode simple
.\start_simple.ps1
```

### 2. Démarrage avec HTTPS (Recommandé)
```powershell
# Démarrer avec HTTPS pour la caméra mobile
.\start_https_dev.ps1
```

### 3. Démarrage Mobile Optimisé
```powershell
# Démarrer optimisé pour mobile
.\start_mobile_optimized.ps1
```

### 4. Démarrage Final (Production)
```powershell
# Démarrer en mode production
.\start_final.ps1
```

## 🔧 Configuration et Installation

### Installation des Dépendances
```bash
# Backend (Python/Django)
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Frontend (React/TypeScript)
cd frontend
npm install
```

### Configuration de la Base de Données
```bash
# Migrations Django
cd backend
python manage.py makemigrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser
```

### Configuration HTTPS
```bash
# Générer les certificats SSL
python setup_https_dev.py
python setup_production_https.py
```

## 🗄️ Gestion de la Base de Données

### Sauvegarde
```bash
# Sauvegarder la base de données SQLite
cd backend
python manage.py dumpdata > backup_sqlite.json

# Sauvegarder avec données spécifiques
python manage.py dumpdata users > users_backup.json
python manage.py dumpdata appointments > appointments_backup.json
python manage.py dumpdata applications > applications_backup.json
```

### Restauration
```bash
# Restaurer depuis une sauvegarde
python manage.py loaddata backup_sqlite.json

# Restaurer des données spécifiques
python manage.py loaddata users_backup.json
```

### Suppression des Données
```bash
# Supprimer toutes les données de test
python manage.py shell
>>> from django.contrib.auth.models import User
>>> from appointments.models import Appointment
>>> from applications.models import Application
>>> User.objects.filter(is_superuser=False).delete()
>>> Appointment.objects.all().delete()
>>> Application.objects.all().delete()
>>> exit()

# Ou utiliser le script de suppression
python create_test_users.py --reset
```

### Migration vers PostgreSQL
```bash
# Migrer de SQLite vers PostgreSQL
python switch_to_postgresql.py
```

## 👥 Gestion des Utilisateurs

### Créer des Utilisateurs de Test
```bash
# Créer des utilisateurs de test
python create_test_users.py

# Créer des utilisateurs spécifiques
python create_test_users.py --admin
python create_test_users.py --vigile
python create_test_users.py --citizen
```

### Gestion des Rôles
```bash
# Changer le rôle d'un utilisateur
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(username='nom_utilisateur')
>>> user.profile.role = 'ADMIN'  # ADMIN, VIGILE, CITIZEN
>>> user.profile.save()
>>> exit()
```

## 🔍 Diagnostic et Dépannage

### Diagnostic Réseau Mobile
```powershell
# Diagnostiquer les problèmes de connexion mobile
.\diagnostic_mobile_network.ps1
.\run_network_diagnostic.ps1
```

### Vérification des Services
```bash
# Vérifier que les services fonctionnent
curl http://localhost:8000/api/health/
curl http://localhost:3000/

# Vérifier les logs
tail -f backend/logs/django.log
```

### Test de la Caméra QR
```powershell
# Tester le scanner QR
.\start_scanner_test.ps1
```

## 🛠️ Maintenance et Nettoyage

### Nettoyage des Logs
```bash
# Vider les logs
echo "" > backend/logs/django.log

# Nettoyer les fichiers temporaires
rm -rf frontend/dist/*
rm -rf backend/__pycache__/*
rm -rf backend/*/__pycache__/*
```

### Redémarrage Propre
```powershell
# Redémarrer tous les services proprement
.\restart_servers_clean.ps1
```

### Mise à Jour des Dépendances
```bash
# Backend
cd backend
pip list --outdated
pip install --upgrade package_name

# Frontend
cd frontend
npm outdated
npm update
```

## 📊 Exports et Rapports

### Export des Données
```bash
# Exporter les rendez-vous
python manage.py shell
>>> from appointments.models import Appointment
>>> import json
>>> appointments = list(Appointment.objects.values())
>>> with open('appointments_export.json', 'w') as f:
...     json.dump(appointments, f, indent=2)

# Exporter les applications
>>> from applications.models import Application
>>> applications = list(Application.objects.values())
>>> with open('applications_export.json', 'w') as f:
...     json.dump(applications, f, indent=2)
```

### Génération de Rapports
```bash
# Générer un rapport de statistiques
python manage.py shell
>>> from appointments.models import Appointment
>>> from applications.models import Application
>>> print(f"Total rendez-vous: {Appointment.objects.count()}")
>>> print(f"Total applications: {Application.objects.count()}")
>>> exit()
```

## 🔒 Sécurité et Permissions

### Vérification des Permissions
```bash
# Vérifier les permissions des fichiers
ls -la backend/
ls -la frontend/

# Vérifier les certificats SSL
openssl x509 -in ssl/cert.pem -text -noout
```

### Audit des Accès
```bash
# Consulter les logs d'accès
grep "POST /api/auth/login" backend/logs/django.log
grep "GET /api/appointments" backend/logs/django.log
```

## 🚨 Dépannage d'Urgence

### Problèmes de Connexion
```powershell
# Redémarrer les services
.\restart_servers_clean.ps1

# Vérifier les ports
netstat -an | findstr :8000
netstat -an | findstr :3000
```

### Problèmes de Caméra
```powershell
# Tester la caméra
.\start_scanner_test.ps1

# Vérifier HTTPS
.\start_https_dev.ps1
```

### Problèmes de Base de Données
```bash
# Vérifier la base de données
python manage.py check --database default

# Réparer la base de données
python manage.py migrate --fake-initial
```

## 📱 Configuration Mobile

### Configuration HTTPS pour Mobile
```bash
# Configurer HTTPS pour la caméra mobile
python setup_camera_mobile.py
```

### Test Mobile
```powershell
# Démarrer en mode mobile
.\start_mobile_servers.ps1
.\start_mobile_fixed.ps1
```

## 🔄 Sauvegarde et Restauration Complète

### Sauvegarde Complète
```bash
# Créer une sauvegarde complète
mkdir backup_$(date +%Y%m%d_%H%M%S)
cd backup_$(date +%Y%m%d_%H%M%S)

# Sauvegarder la base de données
python ../backend/manage.py dumpdata > database_backup.json

# Sauvegarder les fichiers média
cp -r ../backend/media ./media_backup

# Sauvegarder la configuration
cp ../backend/settings.py ./settings_backup.py
```

### Restauration Complète
```bash
# Restaurer depuis une sauvegarde
cd backup_YYYYMMDD_HHMMSS

# Restaurer la base de données
python ../backend/manage.py loaddata database_backup.json

# Restaurer les fichiers média
cp -r media_backup/* ../backend/media/

# Restaurer la configuration
cp settings_backup.py ../backend/settings.py
```

## 🎯 Commandes Rapides

### Démarrage Rapide
```powershell
# Démarrage en une commande
.\start_final.ps1
```

### Arrêt Rapide
```powershell
# Arrêter tous les services
taskkill /f /im python.exe
taskkill /f /im node.exe
```

### Vérification Rapide
```powershell
# Vérifier que tout fonctionne
curl http://localhost:8000/api/health/
curl http://localhost:3000/
```

## 📋 Checklist de Maintenance

### Quotidien
- [ ] Vérifier les logs d'erreur
- [ ] Vérifier l'espace disque
- [ ] Tester la caméra QR
- [ ] Vérifier les sauvegardes

### Hebdomadaire
- [ ] Nettoyer les logs anciens
- [ ] Vérifier les performances
- [ ] Tester les sauvegardes
- [ ] Mettre à jour les dépendances

### Mensuel
- [ ] Audit de sécurité
- [ ] Sauvegarde complète
- [ ] Test de restauration
- [ ] Mise à jour du système

## 🆘 Support et Aide

### Logs Importants
- `backend/logs/django.log` - Logs de l'application
- `frontend/console.log` - Logs du navigateur
- `system.log` - Logs système

### Fichiers de Configuration
- `backend/settings.py` - Configuration Django
- `frontend/vite.config.ts` - Configuration Vite
- `nginx/nginx.conf` - Configuration Nginx

### Contacts
- Documentation: Voir les fichiers GUIDE_*.md
- Problèmes: Consulter les logs et les guides de dépannage
- Support: Utiliser les scripts de diagnostic fournis
