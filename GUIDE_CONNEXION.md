# 🔐 GUIDE DE CONNEXION - AMBASSADE DU CONGO

## ✅ PROBLÈME RÉSOLU !

### 📊 STATUT ACTUEL :
- ✅ **Authentification JWT** : Fonctionne parfaitement
- ✅ **Base de données** : PostgreSQL opérationnel
- ✅ **Serveur Django** : Démarré sur `http://10.0.7.77:8000`
- ✅ **Frontend** : Configuré pour `http://10.0.7.77:3000`

## 🔑 IDENTIFIANTS DE CONNEXION :

```
Email: diembidaniel@gmail.com
Mot de passe: Password@123
```

## 📱 COMMENT SE CONNECTER :

### 1. **Accédez à l'application**
- Ouvrez votre navigateur
- Allez sur : `http://10.0.7.77:3000`

### 2. **Page de connexion**
- Cliquez sur "Connexion" ou allez sur `/login`
- Entrez vos identifiants :
  - **Email** : `diembidaniel@gmail.com`
  - **Mot de passe** : `Password@123`

### 3. **Connexion automatique**
- Cliquez sur "Se connecter"
- Vous serez automatiquement redirigé vers le dashboard

## 🔧 CORRECTIONS APPORTÉES :

### **Backend (Django)**
- ✅ **Vue de connexion JWT** : Utilise maintenant `TokenObtainPairView`
- ✅ **Authentification par email** : Fonctionne correctement
- ✅ **Vérification utilisateur** : Contrôle `is_verified`
- ✅ **Tokens JWT** : Générés et valides

### **Frontend (React)**
- ✅ **Gestion des tokens** : Stockage automatique
- ✅ **Redirection** : Vers dashboard après connexion
- ✅ **Gestion d'erreurs** : Messages clairs
- ✅ **Configuration réseau** : IP `10.0.7.77`

## 🚀 FONCTIONNALITÉS DISPONIBLES :

Une fois connecté, vous pourrez accéder à :
- 📊 **Dashboard** : Vue d'ensemble de votre compte
- 📅 **Rendez-vous** : Planifier des rendez-vous consulaires
- 📋 **Demandes** : Créer et suivre vos demandes
- 💳 **Paiements** : Gérer vos paiements
- 👤 **Profil** : Modifier vos informations personnelles

## 🆘 EN CAS DE PROBLÈME :

### **Erreur "Identifiants incorrects"**
- Vérifiez que vous utilisez : `diembidaniel@gmail.com` et `Password@123`
- Assurez-vous que le serveur Django fonctionne

### **Erreur de réseau**
- Vérifiez que vous êtes sur le même réseau WiFi
- Accédez à `http://10.0.7.77:3000` (pas localhost)

### **Page ne se charge pas**
- Vérifiez que le frontend fonctionne : `npm run dev` dans le dossier frontend
- Vérifiez que le backend fonctionne : `python manage.py runserver 0.0.0.0:8000`

## 📞 SUPPORT :

Si vous rencontrez encore des problèmes, vérifiez :
1. Les serveurs sont-ils démarrés ?
2. Êtes-vous sur la bonne URL (`10.0.7.77:3000`) ?
3. Utilisez-vous les bons identifiants ?

---

**🎉 VOTRE APPLICATION EST PRÊTE À ÊTRE UTILISÉE !**
