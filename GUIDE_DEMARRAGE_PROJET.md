# Guide de Démarrage du Projet

## 📋 Prérequis

- **Python 3.8+** installé
- **Node.js 18+** et **npm** installés
- **Git** pour cloner le projet

## 🚀 Démarrage Rapide

### Option 1 : Démarrage Automatique (Recommandé)

Utilisez le script PowerShell `start_simple.ps1` pour démarrer automatiquement les deux serveurs :

```powershell
.\start_simple.ps1
```

Ce script va :
1. Démarrer le backend Django sur `http://0.0.0.0:8000`
2. Démarrer le frontend Vite sur `http://localhost:3000`
3. Afficher les URLs d'accès

### Option 2 : Démarrage Manuel

#### 1. Backend (Django)

Ouvrez un terminal PowerShell dans le répertoire du projet :

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000
```

Le backend sera accessible sur :
- **URL locale** : http://localhost:8000
- **URL réseau** : http://VOTRE_IP:8000

#### 2. Frontend (React/Vite)

Ouvrez un **nouveau terminal** dans le répertoire du projet :

```powershell
cd frontend
npm install  # Seulement la première fois
npm run dev
```

Le frontend sera accessible sur :
- **URL locale** : http://localhost:3000
- **URL réseau** : http://VOTRE_IP:3000

## 📱 Accès depuis un Mobile

### 1. Obtenir votre adresse IP

Sur Windows :
```powershell
ipconfig
```

Cherchez la ligne **"Adresse IPv4"** sous votre carte réseau active (Wi-Fi ou Ethernet).

Exemple : `192.168.1.2`

### 2. Mettre à jour l'adresse IP

Utilisez le script `update_ip.ps1` pour mettre à jour automatiquement toutes les occurrences de l'IP dans le projet :

```powershell
.\update_ip.ps1
```

Ou manuellement, modifiez les fichiers suivants :
- `frontend/src/lib/api.ts` (ligne 8)
- `start_simple.ps1`
- Tous les fichiers `.md` qui contiennent des exemples d'URL

### 3. Accéder à l'application

Sur votre téléphone (sur le même réseau Wi-Fi) :
```
http://VOTRE_IP:3000
```

**Important** : 
- Assurez-vous que le pare-feu Windows autorise les connexions sur les ports 3000 et 8000
- Vérifiez que le backend et le frontend sont lancés avec `0.0.0.0` (pas `localhost`)

## 🛑 Arrêt des Serveurs

Pour arrêter les serveurs :
1. Appuyez sur **Ctrl + C** dans chaque terminal
2. Ou utilisez le script `stop_servers.ps1` si disponible

## ✅ Vérification

### Backend
Ouvrez votre navigateur et allez sur :
```
http://localhost:8000/api/
```

Vous devriez voir une page JSON avec "Welcome to the Embassy API".

### Frontend
Allez sur :
```
http://localhost:3000
```

Vous devriez voir la page d'accueil de l'application.

## 🔧 Commandes Utiles

### Backend

```powershell
# Activer l'environnement virtuel
cd backend
.\venv\Scripts\Activate.ps1

# Créer les migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Accéder au shell Django
python manage.py shell

# Accéder à l'admin Django
# Ouvrez : http://localhost:8000/admin
```

### Frontend

```powershell
# Installer les dépendances
cd frontend
npm install

# Lancer en mode développement
npm run dev

# Créer une build de production
npm run build

# Prévisualiser la build de production
npm run preview
```

## 🌐 Accès aux Interfaces

Une fois les serveurs démarrés :

| Interface | URL | Description |
|-----------|-----|-------------|
| Frontend | http://localhost:3000 | Interface utilisateur principale |
| Backend API | http://localhost:8000/api | API REST Django |
| Admin Django | http://localhost:8000/admin | Interface d'administration Django |
| API Health | http://localhost:8000/api/health/ | Vérification de la santé du backend |

## 📝 Notes Importantes

1. **Backend** : Toujours utiliser `0.0.0.0:8000` pour l'accès réseau
2. **Frontend** : Par défaut accessible sur `localhost:3000`, changez pour l'accès réseau
3. **IP Mobile** : Utilisez le script `update_ip.ps1` après chaque changement de réseau
4. **CORS** : Les origines autorisées sont configurées dans `backend/embassy_backend/settings.py`

## 🐛 Dépannage

### Le backend ne démarre pas
- Vérifiez que le port 8000 n'est pas utilisé : `netstat -an | findstr :8000`
- Assurez-vous que l'environnement virtuel est activé
- Vérifiez que les migrations sont appliquées : `python manage.py migrate`

### Le frontend ne démarre pas
- Supprimez `node_modules` et réinstallez : `npm install`
- Vérifiez que le port 3000 n'est pas utilisé

### Accès mobile impossible
- Vérifiez que le pare-feu autorise les connexions
- Utilisez `0.0.0.0` au lieu de `localhost` ou `127.0.0.1`
- Vérifiez que le mobile est sur le même réseau Wi-Fi
- Mettez à jour l'adresse IP avec `update_ip.ps1`

## 📞 Support

Pour toute question ou problème, consultez les guides suivants :
- `GUIDE_DEMARRAGE_HTTPS_RAPIDE.md` - Pour HTTPS
- `GUIDE_PRODUCTION_HTTPS.md` - Pour la production
- `README.md` - Documentation générale du projet
