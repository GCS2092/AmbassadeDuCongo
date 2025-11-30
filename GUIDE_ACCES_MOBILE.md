# 📱 Guide d'Accès Mobile - Résolution des Problèmes

## 🚀 Démarrage Rapide

### Option 1 : Script Automatique (Recommandé)

```powershell
.\start_mobile_fixed.ps1
```

Ce script :
- ✅ Détecte automatiquement votre IP réseau
- ✅ Configure l'API URL pour mobile
- ✅ Démarre le backend sur `0.0.0.0:8000` (accessible depuis le réseau)
- ✅ Démarre le frontend sur `0.0.0.0:3000` (accessible depuis le réseau)
- ✅ Affiche l'URL à utiliser sur votre téléphone

### Option 2 : Démarrage Manuel

#### 1. Trouver votre IP réseau

```powershell
ipconfig
```

Cherchez votre **Adresse IPv4** (ex: `192.168.1.2`)

#### 2. Configurer l'API URL

Créez/modifiez `frontend/.env.local` :
```
VITE_API_URL=http://VOTRE_IP:8000/api
```

Exemple : `VITE_API_URL=http://192.168.1.2:8000/api`

#### 3. Démarrer le Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000
```

#### 4. Démarrer le Frontend

```powershell
cd frontend
npm run dev -- --host 0.0.0.0 --port 3000
```

#### 5. Accéder depuis Mobile

Sur votre téléphone (même réseau WiFi) :
```
http://VOTRE_IP:3000
```

Exemple : `http://192.168.1.2:3000`

---

## 🔧 Résolution des Problèmes

### Problème 1 : "Connection refused" ou "Impossible de se connecter"

**Causes possibles :**
1. ❌ Firewall Windows bloque les ports
2. ❌ Backend/Frontend pas démarrés sur `0.0.0.0`
3. ❌ Téléphone pas sur le même réseau WiFi

**Solutions :**

#### A. Autoriser les ports dans le Firewall Windows

```powershell
# Autoriser le port 3000 (Frontend)
netsh advfirewall firewall add rule name="Ambassade Frontend" dir=in action=allow protocol=TCP localport=3000

# Autoriser le port 8000 (Backend)
netsh advfirewall firewall add rule name="Ambassade Backend" dir=in action=allow protocol=TCP localport=8000
```

#### B. Vérifier que les serveurs sont démarrés sur 0.0.0.0

**Backend :**
```powershell
python manage.py runserver 0.0.0.0:8000
# ✅ Correct : 0.0.0.0:8000
# ❌ Incorrect : localhost:8000 ou 127.0.0.1:8000
```

**Frontend :**
```powershell
npm run dev -- --host 0.0.0.0 --port 3000
# ✅ Correct : --host 0.0.0.0
# ❌ Incorrect : sans --host (par défaut localhost)
```

#### C. Vérifier le réseau

- ✅ Téléphone et PC sur le **même réseau WiFi**
- ✅ Pas de réseau invité/isolé
- ✅ WiFi activé sur les deux appareils

---

### Problème 2 : "CORS error" ou "Network Error"

**Cause :** L'API URL n'est pas correctement configurée

**Solution :**

1. Vérifier `frontend/.env.local` :
   ```
   VITE_API_URL=http://VOTRE_IP:8000/api
   ```

2. Vérifier que le backend accepte les connexions :
   - Dans `backend/embassy_backend/settings.py` :
     ```python
     ALLOWED_HOSTS = ['*']  # En développement
     CORS_ALLOW_ALL_ORIGINS = True  # En développement
     ```

3. Redémarrer les serveurs après modification

---

### Problème 3 : "Page blanche" ou "Cannot GET /"

**Cause :** Le frontend n'est pas accessible depuis le réseau

**Solutions :**

1. Vérifier que Vite écoute sur `0.0.0.0` :
   ```powershell
   npm run dev -- --host 0.0.0.0 --port 3000
   ```

2. Vérifier `frontend/vite.config.ts` :
   ```typescript
   server: {
     host: '0.0.0.0',  // ✅ Important !
     port: 3000,
   }
   ```

3. Vérifier le firewall (voir Problème 1)

---

### Problème 4 : L'API ne répond pas depuis mobile

**Cause :** Le backend n'est pas accessible ou l'URL API est incorrecte

**Solutions :**

1. Vérifier que le backend écoute sur `0.0.0.0:8000`

2. Tester l'API directement depuis le téléphone :
   ```
   http://VOTRE_IP:8000/api/core/service-types/
   ```
   Devrait retourner du JSON

3. Vérifier `frontend/src/lib/api.ts` :
   - Doit détecter automatiquement l'IP réseau
   - Doit utiliser `http://${hostname}:8000/api` pour les IPs réseau

4. Vérifier la console du navigateur mobile :
   - Ouvrir les outils de développement
   - Voir les erreurs réseau
   - Vérifier l'URL de l'API utilisée

---

## ✅ Checklist de Vérification

Avant de tester sur mobile, vérifiez :

- [ ] Backend démarré sur `0.0.0.0:8000`
- [ ] Frontend démarré sur `0.0.0.0:3000`
- [ ] Firewall Windows autorise les ports 3000 et 8000
- [ ] `frontend/.env.local` contient `VITE_API_URL=http://VOTRE_IP:8000/api`
- [ ] Téléphone et PC sur le même réseau WiFi
- [ ] IP réseau correcte (vérifier avec `ipconfig`)
- [ ] Backend accessible depuis PC : `http://localhost:8000/api/core/service-types/`
- [ ] Frontend accessible depuis PC : `http://localhost:3000`

---

## 🧪 Test de Connectivité

### Depuis le PC

```powershell
# Tester le backend
Invoke-WebRequest -Uri "http://localhost:8000/api/core/service-types/"

# Tester le frontend
Invoke-WebRequest -Uri "http://localhost:3000"
```

### Depuis le Téléphone

1. Ouvrir un navigateur
2. Tester le backend : `http://VOTRE_IP:8000/api/core/service-types/`
   - Devrait afficher du JSON
3. Tester le frontend : `http://VOTRE_IP:3000`
   - Devrait afficher la page d'accueil

---

## 📝 Notes Importantes

1. **HTTPS vs HTTP** :
   - En développement, HTTP fonctionne
   - Pour la caméra sur Safari iOS, HTTPS est requis
   - Utilisez Chrome ou Firefox sur mobile pour tester la caméra en HTTP

2. **IP Dynamique** :
   - L'IP peut changer si vous changez de réseau WiFi
   - Utilisez `.\start_mobile_fixed.ps1` pour reconfigurer automatiquement

3. **Sécurité** :
   - `ALLOWED_HOSTS = ['*']` est **seulement pour le développement**
   - En production, spécifiez les domaines exacts

---

## 🆘 Support

Si le problème persiste :

1. Vérifier les logs du backend (terminal Django)
2. Vérifier les logs du frontend (terminal Vite)
3. Vérifier la console du navigateur mobile (outils de développement)
4. Vérifier le firewall Windows
5. Essayer de redémarrer les serveurs

**Commande de diagnostic :**
```powershell
# Voir les ports ouverts
netstat -an | findstr "3000 8000"

# Voir les règles firewall
netsh advfirewall firewall show rule name="Ambassade Frontend"
netsh advfirewall firewall show rule name="Ambassade Backend"
```

