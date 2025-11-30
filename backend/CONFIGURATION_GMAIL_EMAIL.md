# 📧 CONFIGURATION EMAIL GMAIL - RAPIDE ET GRATUITE

## 🚀 ÉTAPES RAPIDES

### 1. Créer un mot de passe d'application Gmail

1. **Allez sur** : https://myaccount.google.com/security
2. **Activez la validation en 2 étapes** (si pas déjà fait)
3. **Générez un mot de passe d'application** :
   - Cliquez sur "Mots de passe d'application"
   - Sélectionnez "Autre" et tapez "Ambassade Congo"
   - **Copiez le mot de passe généré** (16 caractères)

### 2. Modifier votre fichier .env backend

**Remplacez ces lignes dans votre `backend/.env` :**

```env
# Configuration Email Gmail
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre.email@gmail.com
EMAIL_HOST_PASSWORD=votre_mot_de_passe_application_16_caracteres
DEFAULT_FROM_EMAIL=votre.email@gmail.com
```

### 3. Exemple concret

Si votre email est `ambassade.congo@gmail.com` et votre mot de passe d'application est `abcd efgh ijkl mnop` :

```env
EMAIL_HOST_USER=ambassade.congo@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
DEFAULT_FROM_EMAIL=ambassade.congo@gmail.com
```

## ✅ AVANTAGES

- ✅ **100% GRATUIT**
- ✅ **SÉCURISÉ** (mot de passe d'application)
- ✅ **RAPIDE** (5 minutes de configuration)
- ✅ **FIABLE** (Gmail infrastructure)
- ✅ **AUCUN ABONNEMENT** requis

## 🔧 TEST

Après configuration, redémarrez Django et testez l'inscription !

```bash
cd C:\CONGOAMBASSADE\backend
.\venv\Scripts\Activate
python manage.py runserver 0.0.0.0:8000
```
