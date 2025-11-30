# 📷 CONFIGURATION HTTPS POUR CAMÉRA

## 🔧 **Solution 1 : Certificat auto-signé**

### **Étape 1 : Générer un certificat SSL**
```bash
# Dans le dossier frontend
npm install -g http-server
mkdir ssl
cd ssl

# Générer une clé privée
openssl genrsa -out key.pem 2048

# Générer un certificat auto-signé
openssl req -new -x509 -key key.pem -out cert.pem -days 365 -subj "/C=CG/ST=Brazzaville/L=Brazzaville/O=Ambassade/CN=192.168.1.2"
```

### **Étape 2 : Démarrer le serveur HTTPS**
```bash
# Dans le dossier frontend/dist
http-server -S -C ../ssl/cert.pem -K ../ssl/key.pem -p 3000
```

### **Étape 3 : Accepter le certificat**
1. Aller sur `https://192.168.1.2:3000`
2. Cliquer "Avancé" → "Continuer vers le site"
3. Autoriser la caméra quand demandé

---

## 🔧 **Solution 2 : ngrok (Recommandée)**

### **Installation ngrok :**
1. Télécharger sur https://ngrok.com/
2. Créer un compte gratuit
3. Obtenir votre token d'authentification

### **Configuration :**
```bash
# Installer ngrok
ngrok config add-authtoken YOUR_TOKEN_HERE

# Exposer le frontend en HTTPS
ngrok http 3000
```

### **Utilisation :**
- Utiliser l'URL HTTPS fournie par ngrok
- La caméra fonctionnera automatiquement

---

## 🔧 **Solution 3 : Améliorer l'interface de scan**

### **Ajouter des instructions claires :**
- Message explicite sur les autorisations
- Bouton de test de la caméra
- Alternative de saisie manuelle

### **Code à ajouter :**
```javascript
// Vérifier les permissions caméra
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('Caméra autorisée')
  })
  .catch(err => {
    console.log('Erreur caméra:', err)
    // Afficher instructions
  })
```
