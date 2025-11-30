# Guide de Démarrage HTTPS Rapide

## 🚀 Démarrage en 3 Étapes

### Étape 1: Vérifier l'Environnement
```bash
# Vérifier que vous êtes dans le bon répertoire
pwd
# Doit afficher: C:\CONGOAMBASSADE

# Vérifier la structure
ls
# Doit voir: backend/, frontend/, start_https_fixed.ps1
```

### Étape 2: Démarrer l'Application
```bash
# Exécuter le script corrigé
./start_https_fixed.ps1
```

### Étape 3: Accéder à l'Application
```
https://localhost:3000
```

## 🔧 Commandes Manuelles (Si le script échoue)

### Backend Django
```bash
# Terminal 1
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000 --settings=embassy_backend.settings_https
```

### Frontend Vite
```bash
# Terminal 2
cd frontend
npm run dev -- --host 0.0.0.0 --port 3000 --https
```

## 📱 Accès Mobile

### 1. Trouver l'IP Locale
```bash
# Windows
ipconfig | findstr IPv4

# Chercher une IP comme: 192.168.1.100
```

### 2. Accéder depuis Mobile
```
https://192.168.1.100:3000
```

**Important:** Acceptez le certificat auto-signé !

## 🐛 Résolution des Problèmes

### Problème 1: "ModuleNotFoundError: No module named 'embassy_backend.settings_https'"
**Solution:** Le fichier a été créé, redémarrez le backend.

### Problème 2: "Could not auto-determine entry point"
**Solution:** Normal pour Vite, l'application fonctionne quand même.

### Problème 3: "Certificate not trusted"
**Solution:** 
1. Cliquez sur "Avancé"
2. Cliquez sur "Continuer vers le site"
3. Acceptez le certificat

### Problème 4: "Connection refused"
**Solution:**
1. Vérifiez que les deux serveurs sont démarrés
2. Vérifiez les ports (8000 pour backend, 3000 pour frontend)
3. Vérifiez l'IP dans l'URL

## ✅ Vérification du Succès

### 1. Backend Fonctionne
```
✅ https://localhost:8000/api/health/
✅ Réponse: {"status": "ok"}
```

### 2. Frontend Fonctionne
```
✅ https://localhost:3000
✅ Page d'accueil s'affiche
✅ Pas d'erreurs dans la console
```

### 3. Caméra Fonctionne
```
✅ Scanner QR s'ouvre
✅ Caméra démarre
✅ Pas d'erreur "Navigateur ne supporte pas la caméra"
```

## 🎯 URLs d'Accès

### Local
- **Frontend:** https://localhost:3000
- **Backend API:** https://localhost:8000

### Réseau (Mobile)
- **Frontend:** https://[VOTRE_IP]:3000
- **Backend API:** https://[VOTRE_IP]:8000

## 🚀 Prochaines Étapes

1. **Tester la caméra** sur Safari
2. **Installer en PWA** sur mobile
3. **Vérifier les permissions** caméra
4. **Tester le scanner QR** complet

L'application est maintenant prête en HTTPS ! 🎉
