# 📱 Guide de Configuration 2FA - Étape par Étape

## Prérequis
- ✅ Application d'authentification installée sur votre téléphone (Google Authenticator, Microsoft Authenticator, Authy, etc.)
- ✅ Compte administrateur (ADMIN ou SUPERADMIN) dans Django Admin
- ✅ Accès à Django Admin

---

## 🚀 Configuration de la 2FA

### Étape 1 : Se connecter à Django Admin

1. Ouvrez votre navigateur et allez à l'URL de Django Admin :
   - **En local** : `http://localhost:8000/admin/`
   - **En production** : `https://ambassade-backend.onrender.com/admin/`

2. Connectez-vous avec votre **email** et **mot de passe** d'administrateur

3. Si c'est votre première connexion avec un compte ADMIN/SUPERADMIN, vous serez automatiquement redirigé vers la page de configuration 2FA

### Étape 2 : Accéder à la page de configuration

**Option A : Redirection automatique**
- Si vous êtes redirigé automatiquement, passez à l'étape 3

**Option B : Accès manuel**
- Cliquez sur votre nom d'utilisateur en haut à droite
- Dans la liste des utilisateurs, trouvez votre compte
- Cliquez sur "Configurer" dans la colonne "Statut 2FA"
- Ou allez directement à : `/admin/setup-2fa/`

### Étape 3 : Scanner le QR Code

1. Sur la page de configuration, vous verrez :
   - Un **QR Code** (carré noir et blanc)
   - Une **clé secrète** (texte en dessous)

2. Ouvrez votre application d'authentification sur votre téléphone :
   - **Google Authenticator** : Appuyez sur le bouton "+" ou "Ajouter un compte"
   - **Microsoft Authenticator** : Appuyez sur "+" puis "Compte professionnel ou scolaire"
   - **Authy** : Appuyez sur "+" puis "Scan QR Code"

3. Scannez le QR Code avec votre téléphone :
   - Pointez l'appareil photo de votre téléphone vers le QR Code
   - L'application détectera automatiquement le QR Code
   - Un nouveau compte sera ajouté dans votre application

   **OU** si le scan ne fonctionne pas :
   - Copiez la **clé secrète** affichée sur la page
   - Dans votre application, choisissez "Entrer une clé de configuration"
   - Collez la clé secrète
   - Donnez un nom au compte (ex: "Ambassade Admin")

### Étape 4 : Vérifier et activer la 2FA

1. Après avoir scanné le QR Code, votre application affichera un **code à 6 chiffres** qui change toutes les 30 secondes

2. Sur la page de configuration, dans le champ "Code de vérification", entrez le **code à 6 chiffres** actuellement affiché dans votre application

3. Cliquez sur **"Vérifier et activer la 2FA"**

4. Si le code est correct :
   - ✅ Un message de succès s'affichera : "La 2FA a été activée avec succès !"
   - Vous serez redirigé vers la page d'accueil de Django Admin
   - La 2FA est maintenant activée !

5. Si le code est incorrect :
   - ❌ Un message d'erreur s'affichera
   - Attendez que le code change (30 secondes) et réessayez
   - **Important** : Les codes changent toutes les 30 secondes, assurez-vous d'utiliser le code actuel

---

## 🔐 Utilisation après configuration

### Connexion avec 2FA

1. Allez à la page de connexion Django Admin : `/admin/login/`

2. Entrez votre **email** et **mot de passe**

3. Après validation du mot de passe, vous serez redirigé vers la page de vérification 2FA

4. Ouvrez votre application d'authentification sur votre téléphone

5. Trouvez le compte "Ambassade Admin" (ou le nom que vous avez donné)

6. Entrez le **code à 6 chiffres** actuellement affiché

7. Cliquez sur **"Vérifier et se connecter"**

8. ✅ Connexion réussie !

---

## ❓ Problèmes courants et solutions

### Problème : "Code de vérification invalide"

**Solutions :**
- ✅ Vérifiez que l'heure de votre téléphone est synchronisée
- ✅ Utilisez le code actuel (les codes changent toutes les 30 secondes)
- ✅ Attendez que le code change et réessayez
- ✅ Vérifiez que vous avez scanné le bon QR Code

### Problème : "Aucun appareil 2FA trouvé"

**Solution :**
- Allez à `/admin/setup-2fa/` pour configurer la 2FA

### Problème : Le QR Code ne se scanne pas

**Solutions :**
- ✅ Assurez-vous que le QR Code est bien visible à l'écran
- ✅ Augmentez la luminosité de votre écran
- ✅ Utilisez la méthode manuelle : copiez la clé secrète et entrez-la manuellement dans l'application

### Problème : L'application ne génère pas de code

**Solutions :**
- ✅ Vérifiez que vous avez bien ajouté le compte dans l'application
- ✅ Vérifiez que l'heure de votre téléphone est correcte
- ✅ Réessayez de scanner le QR Code ou d'entrer la clé secrète

### Problème : Je ne suis pas redirigé vers la configuration 2FA

**Solutions :**
- ✅ Vérifiez que votre rôle est ADMIN ou SUPERADMIN
- ✅ Allez manuellement à `/admin/setup-2fa/`
- ✅ Vérifiez que vous êtes bien connecté à Django Admin

---

## 🔄 Reconfiguration de la 2FA

Si vous devez reconfigurer la 2FA (nouveau téléphone, perte d'accès, etc.) :

1. Connectez-vous à Django Admin (si vous avez encore accès)
2. Allez à `/admin/setup-2fa/`
3. Un nouveau QR Code sera généré
4. Scannez le nouveau QR Code avec votre application
5. Vérifiez avec le nouveau code

**⚠️ Important** : L'ancien code ne fonctionnera plus après reconfiguration.

---

## 🛑 Désactivation de la 2FA

Si vous devez désactiver la 2FA :

1. Connectez-vous à Django Admin
2. Allez à `/admin/disable-2fa/`
3. Cochez la case de confirmation
4. Cliquez sur "Désactiver la 2FA"

**⚠️ Attention** : La désactivation réduit la sécurité de votre compte.

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que votre application d'authentification est à jour
2. Vérifiez que l'heure de votre téléphone est synchronisée
3. Consultez la documentation de votre application d'authentification
4. Contactez un administrateur système si nécessaire

---

## ✅ Checklist de configuration

- [ ] Application d'authentification installée sur le téléphone
- [ ] Connecté à Django Admin avec un compte ADMIN/SUPERADMIN
- [ ] Accédé à la page de configuration 2FA (`/admin/setup-2fa/`)
- [ ] QR Code scanné avec l'application
- [ ] Code à 6 chiffres entré et vérifié
- [ ] Message de succès reçu
- [ ] Test de connexion avec 2FA réussi

---

**🎉 Félicitations ! Votre compte est maintenant protégé par l'authentification à deux facteurs !**

