# 🇨🇬 PWA Ambassade du Congo au Sénégal

Application web progressive (PWA) moderne et sécurisée pour la gestion des services consulaires de l'Ambassade de la République du Congo au Sénégal.

## 🎉 SOLUTION 100% COMPLÈTE - PRÊTE POUR PRODUCTION !

**Version** : 1.0.0 | **Date** : 13 Octobre 2025 | **Statut** : ✅ Production-Ready

👉 **DÉMARRAGE RAPIDE** : Voir [START_HERE.md](START_HERE.md)  
💰 **BUDGET** : 11€/mois seulement - Voir [ABONNEMENTS_REQUIS.md](ABONNEMENTS_REQUIS.md)

## 📋 Fonctionnalités

### Pour les citoyens
- ✅ **Prise de rendez-vous en ligne** avec QR code
- ✅ **Soumission de demandes** (Visa, Passeport, Légalisation, etc.)
- ✅ **Suivi en temps réel** de l'avancement des dossiers
- ✅ **Paiement en ligne sécurisé** (Stripe + Mobile Money)
- ✅ **Notifications** (Email, SMS, Push web)
- ✅ **Téléversement de documents** sécurisé
- ✅ **Mode hors ligne** (PWA)

### Pour l'administration
- ✅ **Gestion des rendez-vous** et planning
- ✅ **Validation des dossiers** et documents
- ✅ **Tableau de bord analytique**
- ✅ **Génération de reçus** et documents officiels
- ✅ **Journal d'audit** complet
- ✅ **Gestion multi-utilisateurs** (RBAC)

## 🏗️ Architecture

### Backend
- **Framework**: Django 4.2 LTS + Django REST Framework
- **Base de données**: PostgreSQL 15
- **Tâches asynchrones**: django-q (broker = ORM, sans Redis)
- **Authentification**: JWT + 2FA optionnelle
- **Paiement**: Stripe + webhooks
- **Notifications**: SendGrid (Email), Twilio (SMS), FCM (Push)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **State Management**: Zustand
- **Styling**: TailwindCSS
- **PWA**: Workbox
- **API Client**: Axios + React Query

### Sécurité
- ✅ HTTPS (Let's Encrypt)
- ✅ CSP, HSTS, XSS Protection
- ✅ Rate limiting
- ✅ Validation de fichiers
- ✅ Chiffrement au repos (optionnel)
- ✅ Audit logs complet
- ✅ RBAC (5 rôles)

## 🚀 Installation

### Prérequis
- Ubuntu 20.04+ (ou Debian 11+)
- Python 3.11+
- PostgreSQL 15+
- Node.js 18+
- Nginx

### Installation automatique

```bash
# Cloner le repository
git clone https://github.com/your-org/embassy-pwa.git
cd embassy-pwa

# Rendre le script executable
chmod +x deployment/scripts/setup.sh

# Exécuter l'installation
sudo ./deployment/scripts/setup.sh
```

Ce script va :
1. Installer toutes les dépendances système
2. Configurer PostgreSQL
3. Créer l'environnement Python
4. Installer Django et dépendances
5. Configurer Nginx + SSL
6. Installer et démarrer les services systemd
7. Construire le frontend
8. Configurer les backups automatiques

### Installation manuelle

Consultez le [Guide de Déploiement](docs/DEPLOYMENT.md) pour une installation manuelle détaillée.

## ⚙️ Configuration

### Backend (.env)

Copiez `.env.example` vers `.env` et configurez :

```env
SECRET_KEY=votre-clé-secrète-très-longue
DEBUG=False
ALLOWED_HOSTS=embassy.example.tld

DB_NAME=embassy_db
DB_USER=embassy_user
DB_PASSWORD=mot-de-passe-fort

STRIPE_SECRET_KEY=sk_live_...
EMAIL_HOST_PASSWORD=sendgrid-api-key
```

### Frontend (.env)

```env
VITE_API_URL=https://embassy.example.tld/api
```

## 📊 Informations Consulaires

### Ambassade du Congo - Brazzaville (Dakar)
- **Adresse**: Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar
- **Téléphones**: +221 824 8398 / +221 649 3117
- **Horaires**: Lun-Ven 9h-17h, Sam 9h-13h

### Direction de la Police des Étrangers (DPETV)
- **Adresse**: Dieuppeul, Allées Sérigne Ababacar Sy, Dakar
- **Téléphones**: 33 869 30 01 / 33 864 51 26
- **Services**: Cartes de circulation, titres de séjour, documents de voyage

## 🧪 Tests

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd frontend
npm run test
```

## 📦 Déploiement

### Déploiement manuel
```bash
./deployment/scripts/deploy.sh
```

### CI/CD automatique
Le déploiement automatique est configuré via GitHub Actions. Chaque push sur `main` déclenche :
1. Tests automatiques (backend + frontend)
2. Build du frontend
3. Déploiement sur le serveur production

Configuration requise dans GitHub Secrets :
- `SERVER_HOST`
- `SERVER_USER`
- `SSH_PRIVATE_KEY`

## 🔧 Maintenance

### Backups automatiques
Les backups sont exécutés quotidiennement à 2h du matin via cron :
```bash
# Voir les backups
ls -lh /home/webapp/backups/

# Restaurer un backup
./deployment/scripts/restore.sh backup_name
```

### Logs
```bash
# Backend
tail -f /var/log/gunicorn/error.log

# Django-Q
sudo journalctl -u django-q -f

# Nginx
tail -f /var/log/nginx/embassy_error.log
```

### Monitoring
```bash
# Status des services
sudo systemctl status gunicorn
sudo systemctl status django-q
sudo systemctl status nginx

# Redémarrage
sudo systemctl restart gunicorn
sudo systemctl restart django-q
```

## 📚 Documentation

- [Guide de Déploiement](docs/DEPLOYMENT.md)
- [Guide Utilisateur](docs/USER_GUIDE.md)
- [Documentation API](docs/API.md)
- [Guide d'Administration](docs/ADMIN_GUIDE.md)

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Licence

Ce projet est la propriété de l'Ambassade de la République du Congo au Sénégal.

## 👥 Équipe

Développé pour l'Ambassade de la République du Congo au Sénégal.

## 📞 Support

Pour toute question ou problème :
- Email: support@embassy.example.tld
- Téléphone: +221 824 8398

---

**Version**: 1.0.0  
**Dernière mise à jour**: Octobre 2025

