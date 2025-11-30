# 📧 Configuration Gmail + Identifiants Complets

## 🔧 Configuration Gmail

### 1. Créer le fichier `.env` dans `backend/` :

```env
# Django Settings
DEBUG=True
SECRET_KEY=4lpk3k-w_wp3b5*1kkj@u&b#t%q3)7gezcs7wzout!gnl_9#)9
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
USE_SQLITE=True

# CORS & CSRF
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Email - Gmail Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre_email@gmail.com
EMAIL_HOST_PASSWORD=votre_mot_de_passe_application_gmail
DEFAULT_FROM_EMAIL=votre_email@gmail.com

# Stripe (paiements)
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Fichiers
MAX_UPLOAD_SIZE=10485760
ALLOWED_DOCUMENT_TYPES=pdf,jpg,jpeg,png

# Application
APPOINTMENT_SLOT_DURATION=30
MAX_APPOINTMENTS_PER_DAY=50
```

### 2. Configuration Gmail (IMPORTANT) :

#### Étape 1 : Activer l'authentification à 2 facteurs
1. Aller sur https://myaccount.google.com/security
2. Activer "Validation en 2 étapes"

#### Étape 2 : Générer un mot de passe d'application
1. Aller sur https://myaccount.google.com/apppasswords
2. Sélectionner "Mail" et "Autre"
3. Nommer l'application : "Ambassade Congo"
4. Copier le mot de passe généré (16 caractères)

#### Étape 3 : Configurer le .env
```env
EMAIL_HOST_USER=votre_email@gmail.com
EMAIL_HOST_PASSWORD=le_mot_de_passe_16_caracteres
DEFAULT_FROM_EMAIL=votre_email@gmail.com
```

---

## 🆔 Identifiants Complets - Carte d'Identité Numérique

### Modèle User étendu avec tous les identifiants :

Le modèle User inclut déjà :
- ✅ Email (login principal)
- ✅ Téléphone
- ✅ Prénom/Nom
- ✅ Photo de profil

### Modèle Profile étendu avec identifiants officiels :

Le modèle Profile inclut déjà :
- ✅ Date de naissance
- ✅ Lieu de naissance
- ✅ Genre
- ✅ Nationalité
- ✅ Numéro consulaire
- ✅ Numéro de passeport
- ✅ Date d'expiration passeport
- ✅ Adresse complète
- ✅ Contact d'urgence

---

## 📱 PWA Responsive - Configuration

### 1. Service Worker déjà configuré
- ✅ `service-worker-registration.ts`
- ✅ Mode hors ligne
- ✅ Cache intelligent

### 2. Responsive Design avec TailwindCSS
- ✅ Mobile-first design
- ✅ Breakpoints responsive
- ✅ Touch-friendly interface

### 3. PWA Manifest
- ✅ `vite-plugin-pwa` configuré
- ✅ Icônes adaptatives
- ✅ Installation sur mobile

---

## 🧪 Test des Emails

### Commande de test :
```bash
cd backend
python manage.py shell

# Tester l'envoi d'email
from django.core.mail import send_mail
send_mail(
    'Test Email',
    'Ceci est un test d\'envoi d\'email depuis l\'ambassade.',
    'votre_email@gmail.com',
    ['destinataire@example.com'],
    fail_silently=False,
)
```

---

## 📱 Test sur Téléphone

### 1. Lancer les serveurs
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver 0.0.0.0:8000

# Terminal 2 - Frontend  
cd frontend
npm run dev -- --host
```

### 2. Accès depuis téléphone
- URL : `http://VOTRE_IP:3000`
- Tester toutes les fonctionnalités
- Vérifier le responsive design
- Tester l'installation PWA

---

## 🎯 Fonctionnalités Carte d'Identité Numérique

### Affichage du profil complet :
- 👤 Informations personnelles
- 📄 Documents officiels
- 🏠 Adresse complète
- 🆘 Contact d'urgence
- 📸 Photo de profil
- 🎫 Numéros officiels (consulaire, passeport)

### Édition sécurisée :
- ✅ Validation des données
- ✅ Sauvegarde progressive
- ✅ Historique des modifications
- ✅ Export PDF du profil

---

## 🚀 Prochaines Étapes

1. **Créer le fichier .env** avec vos informations Gmail
2. **Tester l'envoi d'emails** localement
3. **Lancer sur téléphone** pour tester le responsive
4. **Vérifier l'installation PWA** sur mobile

**Votre application sera alors une vraie carte d'identité numérique !** 🎉
