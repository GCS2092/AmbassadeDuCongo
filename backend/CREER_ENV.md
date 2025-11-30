# 📝 CRÉER LE FICHIER .env

## ✅ Méthode Rapide (Copier-Coller)

### Option 1 : Via PowerShell
```powershell
cd C:\CONGOAMBASSADE\backend
Copy-Item .env.example .env
```

### Option 2 : Manuellement
1. Ouvrez le dossier `backend/`
2. Copiez le fichier `.env.example`
3. Renommez la copie en `.env` (sans "example")

---

## 📄 Contenu du fichier .env

Si vous préférez créer le fichier manuellement, créez un fichier nommé `.env` dans le dossier `backend/` avec ce contenu :

```env
# CONFIGURATION DÉVELOPPEMENT LOCAL
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production-12345
ALLOWED_HOSTS=localhost,127.0.0.1

# Database - SQLite (aucune installation nécessaire)
USE_SQLITE=True

# CORS & CSRF
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Email (console uniquement)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@embassy.cg

# Stripe (laissez vide pour l'instant)
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

---

## 🎯 Ce qui est IMPORTANT

### ✅ Vous N'AVEZ PAS BESOIN de :
- ❌ Clés Stripe (vous pouvez tester sans paiement)
- ❌ PostgreSQL (SQLite fonctionne parfaitement)
- ❌ Compte AWS S3 (fichiers en local)
- ❌ Compte SendGrid (emails dans la console)
- ❌ Compte Sentry (monitoring optionnel)

### ✅ Configuration Minimale :
```env
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production-12345
USE_SQLITE=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

C'est TOUT ! 🎉

---

## 🗄️ Base de données

### Pour le développement (recommandé)
**Utilisez SQLite** - aucune configuration nécessaire !
```env
USE_SQLITE=True
```

Le fichier `db.sqlite3` sera créé automatiquement dans `backend/`

### Pour PostgreSQL (optionnel)
Si vous voulez vraiment utiliser PostgreSQL :

**1. Créer la base de données :**
```sql
CREATE DATABASE embassy_db;
CREATE USER embassy_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE embassy_db TO embassy_user;
```

**2. Modifier le .env :**
```env
USE_SQLITE=False
DB_NAME=embassy_db
DB_USER=embassy_user
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
DB_PORT=5432
```

---

## 🚀 Après avoir créé le .env

```powershell
cd backend
.\venv\Scripts\Activate
python manage.py migrate
python manage.py setup_initial_data
python manage.py createsuperuser
python manage.py runserver
```

✅ **Votre backend sera prêt !** → http://localhost:8000

---

## 📧 Les emails en développement

Avec `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`, tous les emails apparaîtront dans votre terminal (console) au lieu d'être envoyés réellement.

**Exemple :**
```
Content-Type: text/plain; charset="utf-8"
From: noreply@embassy.cg
To: user@example.com
Subject: Confirmation de rendez-vous

Bonjour,
Votre rendez-vous a été confirmé...
```

---

## 🎉 C'est tout !

Vous n'avez besoin d'AUCUNE clé externe pour développer.
Tout fonctionnera en local avec cette configuration simple !

