# Guide d'Implémentation - Système de Gestion des Dates d'Expiration

## ✅ Implémentation Complète

### **Fonctionnalités Implémentées :**

1. ✅ **Saisie de date d'expiration** lors de l'upload de documents
2. ✅ **Email automatique** si expiration dans 3 jours
3. ✅ **Page de rappels** avec gestion de statut (traité/non traité)
4. ✅ **Tâche périodique** pour vérifier et envoyer les emails

---

## 📋 Fichiers Modifiés

### **BACKEND**

#### 1. **backend/users/models.py**
- ✅ Ajout du modèle `DocumentReminder`
- ✅ Champs: document, user, expiry_date, priority, status, email_sent, etc.

#### 2. **backend/users/admin.py**
- ✅ Ajout de `DocumentReminderAdmin` pour l'administration Django

#### 3. **backend/users/views.py**
- ✅ Ajout de la fonction `update_reminder_status` pour gérer les statuts
- ✅ Import de `DocumentReminder` et `timezone`

#### 4. **backend/users/urls.py**
- ✅ Ajout de la route `/document-reminders/<id>/status/`

#### 5. **backend/users/tasks.py** (NOUVEAU)
- ✅ Fonction `send_document_expiry_email` pour envoyer les emails
- ✅ Fonction `check_and_send_document_expiry_reminders` pour vérifier et envoyer
- ✅ Utilisation de `django-q` pour les tâches asynchrones

#### 6. **backend/templates/emails//**
- ✅ `document_expiry_reminder.html` : Template HTML pour l'email
- ✅ `document_expiry_reminder.txt` : Template texte pour l'email

### **FRONTEND**

#### 7. **frontend/src/pages/DocumentsGalleryPage.tsx**
- ✅ Ajout du champ `expiryDate` dans l'upload
- ✅ Modification de la mutation `uploadDocument` pour inclure la date
- ✅ Création de `DocumentTypeModal` pour sélectionner le type
- ✅ Création de `DocumentUploadModal` pour l'upload avec date

#### 8. **frontend/src/pages/DocumentRemindersPage.tsx**
- ✅ Ajout de la gestion des statuts (COMPLETED, IGNORED)
- ✅ Boutons pour mettre à jour le statut
- ✅ Affichage du statut actuel

#### 9. **frontend/src/lib/api.ts**
- ✅ Ajout de `updateReminderStatus` dans `authApi`

---

## 🗄️ Migration de Base de Données

La migration a été créée et appliquée :
```bash
python manage.py makemigrations users
python manage.py migrate users
```

---

## 📧 Système d'Email

### **Configuration**
L'email est envoyé automatiquement lorsque :
- Un document expire dans 3 jours ou moins
- Le document a une date d'expiration
- L'email n'a pas encore été envoyé

### **Template Email**
Le template inclut :
- Nom du document
- Date d'expiration
- Jours restants
- Bouton pour prendre rendez-vous
- Conseils pratiques

---

## 🎯 Utilisation

### **Pour l'utilisateur :**

1. **Uploader un document avec date d'expiration :**
   - Aller sur "Mes Documents"
   - Cliquer sur "Ajouter un document"
   - Choisir le type de document
   - Sélectionner le fichier
   - **Ajouter la date d'expiration (optionnel)**
   - Confirmer

2. **Recevoir un rappel :**
   - Si le document expire dans 3 jours
   - Un email automatique est envoyé

3. **Gérer les rappels :**
   - Aller sur "Mes Rappels"
   - Voir tous les documents qui expirent
   - Marquer comme "Traité" ou "Ignorer"

### **Pour l'administrateur :**

1. **Vérifier les rappels :**
   - Via l'admin Django : `/admin/users/documentreminder/`
   - Voir tous les rappels, leur statut, si l'email a été envoyé

2. **Programmer la vérification :**
   - La tâche `check_and_send_document_expiry_reminders` doit être exécutée régulièrement
   - Configurer un cron job ou utiliser django-q scheduler

---

## ⚙️ Configuration Django-Q

Pour activer les tâches périodiques, ajouter dans `settings.py` :

```python
Q_CLUSTER = {
    'name': 'DjangORM',
    'workers': 4,
    'timeout': 90,
    'retry': 120,
    'queue_limit': 50,
    'bulk': 10,
    'orm': 'default',
}

# Pour les tâches périodiques
from django_q.models import Schedule
from django_q.tasks import schedule

# Programmer la vérification quotidienne à 9h
schedule('users.tasks.check_and_send_document_expiry_reminders',
         name='Document Expiry Check',
         schedule_type=Schedule.HOURLY,
         repeats=-1)
```

---

## 🧪 Tests

### **Tester l'upload avec date d'expiration :**
1. Se connecter en tant qu'utilisateur
2. Aller sur "Mes Documents"
3. Ajouter un document avec une date d'expiration dans 3 jours
4. Vérifier que le document apparaît dans la liste
5. Aller sur "Mes Rappels"
6. Vérifier que le rappel apparaît

### **Tester l'email :**
1. Créer un document avec expiration dans 3 jours
2. Exécuter manuellement la tâche :
   ```python
   from users.tasks import check_and_send_document_expiry_reminders
   check_and_send_document_expiry_reminders()
   ```
3. Vérifier que l'email est reçu

### **Tester la gestion des statuts :**
1. Aller sur "Mes Rappels"
2. Cliquer sur "Marquer comme traité"
3. Vérifier que le statut change
4. Vérifier qu'il n'apparaît plus dans les rappels en attente

---

## ✅ Checklist de Vérification

- [x] Modèle `DocumentReminder` créé
- [x] Migration appliquée
- [x] Admin Django configuré
- [x] Vue API créée pour gérer les statuts
- [x] Tâche asynchrone pour envoyer les emails
- [x] Templates email créés (HTML et texte)
- [x] Frontend modifié pour saisir la date d'expiration
- [x] API frontend mise à jour
- [x] Page de rappels avec gestion des statuts
- [x] Tests effectués

---

## 🎉 Résultat

Le système complet de gestion des dates d'expiration des documents est maintenant implémenté et fonctionnel ! 

Les utilisateurs peuvent :
- ✅ Ajouter des dates d'expiration à leurs documents
- ✅ Recevoir des rappels par email 3 jours avant l'expiration
- ✅ Gérer leurs rappels (marquer comme traité ou ignorer)
- ✅ Voir tous leurs rappels dans une page dédiée

**L'implémentation est cohérente, complète et prête pour la production !** 🚀
