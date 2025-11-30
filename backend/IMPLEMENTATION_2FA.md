# 🔐 Implémentation de l'Authentification à Deux Facteurs (2FA) pour Django Admin

## Vue d'ensemble

Cette implémentation force l'authentification à deux facteurs (2FA) via TOTP (Time-based One-Time Password) pour tous les utilisateurs ayant le rôle **ADMIN** ou **SUPERADMIN** qui accèdent à Django Admin.

## Fonctionnalités

### 1. Configuration automatique
- Les admins et super admins sont automatiquement redirigés vers la page de configuration 2FA lors de leur première connexion
- Génération automatique d'un QR code à scanner avec une application d'authentification
- Support de la saisie manuelle de la clé secrète

### 2. Vérification obligatoire
- Après la configuration, les admins doivent entrer un code 2FA à chaque connexion à Django Admin
- Le middleware `Admin2FAMiddleware` intercepte toutes les requêtes vers `/admin/` et vérifie la 2FA

### 3. Gestion de la 2FA
- Possibilité de reconfigurer la 2FA
- Possibilité de désactiver la 2FA (avec confirmation)
- Affichage du statut 2FA dans la liste des utilisateurs dans Django Admin

## Fichiers créés/modifiés

### Nouveaux fichiers

1. **`backend/users/admin_2fa.py`**
   - `Setup2FAView` : Configuration de la 2FA avec génération de QR code
   - `Verify2FAView` : Vérification du code 2FA (pendant une session active)
   - `Disable2FAView` : Désactivation de la 2FA

2. **`backend/users/admin_login.py`**
   - `AdminLoginView` : Vue de connexion personnalisée qui intègre la 2FA
   - `AdminLoginVerify2FAView` : Vérification 2FA lors de la connexion initiale

3. **`backend/users/middleware_2fa.py`**
   - `Admin2FAMiddleware` : Middleware qui force la 2FA pour les admins

4. **Templates**
   - `backend/templates/admin/login_2fa.html` : Page de connexion personnalisée
   - `backend/templates/admin/login_verify_2fa.html` : Page de vérification 2FA lors de la connexion
   - `backend/templates/admin/setup_2fa.html` : Page de configuration 2FA
   - `backend/templates/admin/verify_2fa.html` : Page de vérification 2FA (session active)
   - `backend/templates/admin/disable_2fa.html` : Page de désactivation 2FA

### Fichiers modifiés

1. **`backend/embassy_backend/urls.py`**
   - Remplacement de la vue de login par défaut par `AdminLoginView`
   - Ajout des URLs pour les vues 2FA :
     - `/admin/login/` : Connexion personnalisée avec support 2FA
     - `/admin/login/verify-2fa/` : Vérification 2FA lors de la connexion
     - `/admin/setup-2fa/` : Configuration
     - `/admin/verify-2fa/` : Vérification (pendant une session active)
     - `/admin/disable-2fa/` : Désactivation

2. **`backend/embassy_backend/settings.py`**
   - Ajout du middleware `users.middleware_2fa.Admin2FAMiddleware` dans `MIDDLEWARE`

3. **`backend/users/admin.py`**
   - Ajout de la colonne `get_2fa_status` dans `list_display`
   - Affichage du statut 2FA avec liens vers la configuration/désactivation

## Utilisation

### Pour un administrateur

1. **Première connexion**
   - Se connecter à Django Admin avec email/mot de passe
   - Être automatiquement redirigé vers `/admin/setup-2fa/`
   - Scanner le QR code avec **Google Authenticator** (ou une autre application d'authentification)
   - Entrer le code à 6 chiffres pour confirmer
   - La 2FA est maintenant activée

2. **Connexions suivantes (après déconnexion)**
   - Se connecter à Django Admin avec email/mot de passe
   - **Après la vérification du mot de passe**, être automatiquement redirigé vers `/admin/login/verify-2fa/`
   - Ouvrir **Google Authenticator** sur votre téléphone
   - Entrer le code à 6 chiffres affiché dans l'application
   - Cliquer sur "Vérifier et se connecter"
   - Accéder à Django Admin

3. **Pendant une session active**
   - Si vous êtes déjà connecté et que la session expire ou que vous accédez à une page protégée
   - Être redirigé vers `/admin/verify-2fa/`
   - Entrer le code 2FA pour continuer

3. **Reconfiguration**
   - Cliquer sur "Reconfigurer" dans la colonne "Statut 2FA" de la liste des utilisateurs
   - Ou accéder directement à `/admin/setup-2fa/`
   - Scanner un nouveau QR code ou utiliser la nouvelle clé secrète

4. **Désactivation**
   - Cliquer sur "Désactiver" dans la colonne "Statut 2FA"
   - Confirmer la désactivation
   - ⚠️ **Attention** : La désactivation réduit la sécurité du compte

## Applications d'authentification recommandées

**Application principale utilisée :**
- **Google Authenticator** (iOS/Android) - **Recommandé et testé**

**Autres applications compatibles :**
- **Microsoft Authenticator** (iOS/Android)
- **Authy** (iOS/Android)
- **1Password** (iOS/Android/Desktop)
- **LastPass Authenticator** (iOS/Android)

> **Note** : Toutes ces applications utilisent le standard TOTP (Time-based One-Time Password) et sont compatibles avec cette implémentation.

## Sécurité

### Protection contre les attaques
- Le middleware vérifie la 2FA avant chaque accès à Django Admin
- **La 2FA est demandée à chaque connexion** (après déconnexion)
- Les codes TOTP expirent après 30 secondes
- Les codes sont à usage unique
- Protection contre les attaques par force brute via Django Axes
- L'utilisateur n'est connecté qu'après vérification réussie du code 2FA

### Flux de sécurité
1. **Connexion** : Email + Mot de passe
2. **Vérification 2FA** : Code à 6 chiffres depuis Google Authenticator
3. **Connexion effective** : L'utilisateur est connecté uniquement après validation du code 2FA

### Limitations
- La 2FA n'est requise que pour les rôles ADMIN et SUPERADMIN
- Les autres utilisateurs (CITIZEN, AGENT_RDV, etc.) ne sont pas affectés
- La 2FA n'est active que pour Django Admin, pas pour l'API REST

## Dépannage

### Problème : "Aucun appareil 2FA trouvé"
- **Solution** : Accéder à `/admin/setup-2fa/` pour configurer la 2FA

### Problème : "Code de vérification invalide"
- **Solution** : Vérifier que l'heure de votre appareil est synchronisée
- Vérifier que vous utilisez le bon code (les codes changent toutes les 30 secondes)
- Réessayer avec un nouveau code

### Problème : Impossible d'accéder à Django Admin
- **Solution** : Vérifier que vous avez bien configuré la 2FA
- Vérifier que votre rôle est ADMIN ou SUPERADMIN
- Vérifier que `is_2fa_enabled` est à `True` dans la base de données

## Tests

Pour tester l'implémentation :

1. Créer un utilisateur avec le rôle ADMIN ou SUPERADMIN
2. Se connecter à Django Admin
3. Vérifier la redirection vers `/admin/setup-2fa/`
4. Configurer la 2FA
5. Se déconnecter et se reconnecter
6. Vérifier la redirection vers `/admin/verify-2fa/`
7. Entrer le code 2FA
8. Vérifier l'accès à Django Admin

## Notes techniques

- Utilise `django-otp` pour la gestion des appareils TOTP
- Utilise `qrcode` pour la génération des QR codes
- Le middleware s'exécute après `django_otp.middleware.OTPMiddleware`
- Les templates étendent `admin/base_site.html` de Django

## Support

Pour toute question ou problème, consulter :
- Documentation Django OTP : https://django-otp.readthedocs.io/
- Documentation TOTP : https://tools.ietf.org/html/rfc6238

