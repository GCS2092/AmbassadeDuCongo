# Guide des Messages d'Erreur et de Validation

## Vue d'ensemble

Ce guide explique comment utiliser les nouveaux composants de gestion d'erreurs et de validation ajoutés à l'application. Ces composants offrent une expérience utilisateur améliorée avec des messages d'erreur clairs et informatifs.

## Composants Ajoutés

### 1. ErrorMessage
Composant d'affichage d'erreur réutilisable avec icônes et styles appropriés.

```tsx
import ErrorMessage from '../components/ErrorMessage'

<ErrorMessage
  title="Erreur de connexion"
  message="Impossible de se connecter au serveur"
  type="error" // 'error' | 'warning' | 'info' | 'network' | 'auth'
  onRetry={() => console.log('Réessayer')}
  onDismiss={() => console.log('Fermer')}
/>
```

### 2. FormField
Composant de champ de formulaire avec validation et messages d'erreur améliorés.

```tsx
import FormField, { Input } from '../components/FormField'

<FormField
  label="Email"
  error={errors.email?.message}
  required
  helpText="Entrez votre adresse email"
>
  <Input
    type="email"
    {...register('email')}
    placeholder="votre@email.com"
    error={!!errors.email}
  />
</FormField>
```

### 3. ValidationFeedback
Composant de validation en temps réel avec feedback visuel.

```tsx
import ValidationFeedback, { validationRules } from '../components/ValidationFeedback'

<ValidationFeedback
  value={email}
  rules={[validationRules.email, validationRules.required]}
  onValidationChange={(isValid, errors) => console.log(isValid, errors)}
/>
```

### 4. ErrorModal
Modal d'erreur pour les erreurs critiques.

```tsx
import ErrorModal from '../components/ErrorModal'

<ErrorModal
  isOpen={showError}
  onClose={() => setShowError(false)}
  title="Erreur critique"
  message="Une erreur grave s'est produite"
  type="error"
  onRetry={() => window.location.reload()}
/>
```

### 5. ErrorBoundary
Composant pour capturer les erreurs React non gérées.

```tsx
import ErrorBoundary from '../components/ErrorBoundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 6. SuccessMessage
Composant de message de succès pour équilibrer les messages d'erreur.

```tsx
import SuccessMessage from '../components/SuccessMessage'

<SuccessMessage
  title="Succès"
  message="Opération réussie"
  type="success"
  onDismiss={() => console.log('Fermer')}
/>
```

## Règles de Validation Disponibles

```tsx
import { validationRules } from '../components/ValidationFeedback'

// Email
validationRules.email

// Champ requis
validationRules.required

// Longueur minimale
validationRules.minLength(8)

// Longueur maximale
validationRules.maxLength(100)

// Téléphone
validationRules.phone

// Mot de passe fort
validationRules.password

// Correspondance de mot de passe
validationRules.passwordMatch(password)

// Format de passeport
validationRules.passport
```

## Gestion d'Erreurs API Améliorée

### Intercepteur Axios
L'intercepteur Axios a été amélioré pour fournir des messages d'erreur plus détaillés :

- **400** : Données invalides
- **401** : Non autorisé (session expirée)
- **403** : Accès refusé
- **404** : Ressource non trouvée
- **422** : Validation échouée
- **429** : Trop de requêtes
- **500** : Erreur serveur
- **Réseau** : Problème de connexion

### Styles de Toast Améliorés
Les notifications toast ont été améliorées avec :
- Styles conditionnels selon le type d'erreur
- Durées d'affichage adaptées
- Couleurs et icônes appropriées
- Messages plus informatifs

## Exemples d'Utilisation

### Page de Connexion
```tsx
// Gestion d'erreurs détaillée
catch (error: any) {
  let errorTitle = 'Erreur de connexion'
  let errorMessage = 'Une erreur est survenue'
  
  if (error.response?.status === 401) {
    errorTitle = 'Identifiants incorrects'
    errorMessage = 'Email ou mot de passe incorrect'
  } else if (error.response?.status === 403) {
    errorTitle = 'Compte non autorisé'
    errorMessage = 'Votre compte n\'est pas autorisé'
  }
  
  toast.error(`${errorTitle}: ${errorMessage}`, {
    duration: 5000,
    style: { /* styles personnalisés */ }
  })
}
```

### Formulaire avec Validation
```tsx
import FormValidation, { ValidatedField } from '../components/FormValidation'

<FormValidation
  schema={registerSchema}
  onSubmit={handleSubmit}
  showSuccessMessage={true}
  successMessage="Inscription réussie !"
>
  {(form) => (
    <>
      <ValidatedField
        name="email"
        label="Email"
        type="email"
        required
        form={form}
        validationRules={[validationRules.email]}
      />
      
      <ValidatedField
        name="password"
        label="Mot de passe"
        type="password"
        required
        form={form}
        validationRules={[validationRules.password]}
      />
    </>
  )}
</FormValidation>
```

## Bonnes Pratiques

### 1. Messages d'Erreur
- Utilisez des messages clairs et actionables
- Évitez le jargon technique
- Proposez des solutions quand possible
- Utilisez des titres descriptifs

### 2. Validation
- Validez en temps réel pour une meilleure UX
- Utilisez des règles de validation appropriées
- Affichez des messages d'aide contextuels
- Indiquez visuellement l'état de validation

### 3. Gestion d'Erreurs
- Gérez les erreurs à différents niveaux (API, composant, global)
- Utilisez des types d'erreur appropriés
- Proposez des actions de récupération
- Loggez les erreurs pour le debugging

### 4. Accessibilité
- Utilisez des icônes appropriées
- Assurez-vous que les messages sont lisibles
- Utilisez des couleurs contrastées
- Supportez la navigation au clavier

## Configuration

### Toaster Global
Le toaster a été configuré avec des styles par défaut améliorés :

```tsx
<Toaster 
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: { /* styles par défaut */ },
    success: { style: { /* styles succès */ } },
    error: { style: { /* styles erreur */ } },
    loading: { style: { /* styles chargement */ } }
  }}
/>
```

### ErrorBoundary Global
L'ErrorBoundary est configuré au niveau de l'application pour capturer toutes les erreurs React.

## Tests

Pour tester les messages d'erreur :

1. **Erreurs de connexion** : Utilisez des identifiants incorrects
2. **Erreurs de validation** : Soumettez des formulaires avec des données invalides
3. **Erreurs réseau** : Déconnectez l'internet ou arrêtez le serveur
4. **Erreurs serveur** : Simulez des erreurs 500 côté serveur

## Maintenance

- Surveillez les logs d'erreur en production
- Mettez à jour les messages selon les retours utilisateurs
- Ajoutez de nouvelles règles de validation si nécessaire
- Testez régulièrement la gestion d'erreurs
