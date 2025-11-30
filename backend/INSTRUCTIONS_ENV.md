# 🔐 INSTRUCTIONS POUR LE FICHIER .env

## 📋 CE QUE VOUS DEVEZ FAIRE

### 1. Créer le fichier `.env` dans `backend/`

Créez un fichier nommé `.env` dans le dossier `backend/` (à côté de `settings.py`).

### 2. Générer les clés de sécurité

Exécutez cette commande pour générer automatiquement les clés :

```bash
cd backend
python manage.py generate_security_keys
```

Cette commande générera :
- `SECRET_KEY` (clé Django)
- `ENCRYPTION_KEY` (clé de chiffrement)

**Copiez ces clés** et ajoutez-les dans votre fichier `.env`.

### 3. Remplir le fichier `.env`

Utilisez le fichier `backend/.env.example` comme modèle et remplissez toutes les valeurs.

**Variables OBLIGATOIRES :**

```env
# Django Core
SECRET_KEY=votre-secret-key-générée-ici
DEBUG=False
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com

# Base de données
USE_SQLITE=False
DB_NAME=embassy_db
DB_USER=embassy_user
DB_PASSWORD=votre-mot-de-passe-db-fort
DB_HOST=localhost
DB_PORT=5432

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=slovengama@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-gmail-app
DEFAULT_FROM_EMAIL=slovengama@gmail.com

# Chiffrement
ENCRYPTION_KEY=votre-cle-encryption-générée-ici

# CORS (Production)
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
CSRF_TRUSTED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
```

**Variables OPTIONNELLES :**

```env
# Stripe (si vous utilisez les paiements)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (si vous stockez les fichiers sur S3)
USE_S3=False
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=...
AWS_S3_REGION_NAME=us-east-1

# Sentry (monitoring)
SENTRY_DSN=...
```

### 4. Pour Gmail (EMAIL_HOST_PASSWORD)

1. Allez sur https://myaccount.google.com/apppasswords
2. Créez un "App Password" pour "Mail"
3. Utilisez ce mot de passe (16 caractères) dans `EMAIL_HOST_PASSWORD`

**⚠️ NE PAS utiliser votre mot de passe Gmail normal !**

### 5. Vérifications importantes

✅ Le fichier `.env` est dans `backend/.env` (pas à la racine)
✅ Le fichier `.env` est dans `.gitignore` (ne sera pas commité)
✅ `DEBUG=False` en production
✅ `ALLOWED_HOSTS` contient uniquement vos domaines réels
✅ `CORS_ALLOW_ALL_ORIGINS=False` en production
✅ Toutes les clés sont générées et uniques

### 6. En développement

Pour le développement local, vous pouvez utiliser :

```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.2
CORS_ALLOW_ALL_ORIGINS=True
```

Mais **JAMAIS en production** !

---

## 🚨 SÉCURITÉ CRITIQUE

1. **NE COMMITEZ JAMAIS** le fichier `.env` dans Git
2. **NE PARTAGEZ JAMAIS** vos clés avec qui que ce soit
3. **GÉNÉREZ DES CLÉS UNIQUES** pour chaque environnement (dev, staging, prod)
4. **ROTATION DES CLÉS** : Changez les clés régulièrement (tous les 6 mois)
5. **BACKUP SÉCURISÉ** : Gardez une copie sécurisée de vos clés (hors du code)

---

## 📝 EXEMPLE COMPLET

Voir `backend/.env.example` pour un exemple complet avec toutes les variables documentées.

