# 📘 Documentation API

Documentation complète de l'API REST de la PWA Ambassade du Congo.

## Base URL

```
Production: https://embassy.example.tld/api
Développement: http://localhost:8000/api
```

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Obtenir un token

**POST** `/auth/login/`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Utiliser le token

Ajouter le header à toutes les requêtes authentifiées :
```
Authorization: Bearer <access_token>
```

### Rafraîchir le token

**POST** `/auth/refresh/`

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Endpoints

### 🔐 Authentication

#### Inscription
**POST** `/auth/register/`

```json
{
  "email": "user@example.com",
  "username": "username",
  "first_name": "Prénom",
  "last_name": "Nom",
  "phone_number": "+221XXXXXXXXX",
  "password": "password123",
  "password_confirm": "password123"
}
```

#### Profil utilisateur
**GET** `/auth/profile/`

**Response**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Prénom",
  "last_name": "Nom",
  "role": "CITIZEN",
  "is_verified": true,
  "profile": {
    "date_of_birth": "1990-01-01",
    "nationality": "CG",
    "passport_number": "ABC123456"
  }
}
```

### 🏢 Bureaux Consulaires

#### Liste des bureaux
**GET** `/core/offices/`

**Response**
```json
[
  {
    "id": 1,
    "name": "Ambassade du Congo - Dakar",
    "office_type": "EMBASSY",
    "address_line1": "Stèle Mermoz, Pyrotechnie",
    "city": "Dakar",
    "phone_primary": "+221 824 8398",
    "email": "contact@ambassade-congo.sn",
    "latitude": 14.7167,
    "longitude": -17.4677,
    "is_active": true
  }
]
```

#### Services d'un bureau
**GET** `/core/offices/{id}/services/`

### 📋 Services

#### Liste des services
**GET** `/core/services/`

**Query Parameters:**
- `category`: Filter by category (VISA, PASSPORT, etc.)

**Response**
```json
[
  {
    "id": 1,
    "name": "Visa Tourisme",
    "category": "VISA",
    "category_display": "Visa",
    "base_fee": 50000,
    "processing_time_days": 5,
    "requires_appointment": true
  }
]
```

### 📅 Rendez-vous

#### Liste des rendez-vous
**GET** `/appointments/`

**Query Parameters:**
- `status`: PENDING, CONFIRMED, COMPLETED, CANCELLED
- `office`: Office ID
- `service_type`: Service ID

#### Créer un rendez-vous
**POST** `/appointments/`

```json
{
  "office": 1,
  "service_type": 1,
  "appointment_date": "2025-11-15",
  "appointment_time": "10:00",
  "duration_minutes": 30,
  "user_notes": "Notes optionnelles"
}
```

**Response 201**
```json
{
  "id": 1,
  "reference_number": "APT-ABC12345",
  "office_name": "Ambassade du Congo",
  "service_name": "Visa Tourisme",
  "appointment_date": "2025-11-15",
  "appointment_time": "10:00:00",
  "status": "PENDING",
  "qr_code_url": "https://...",
  "created_at": "2025-10-12T14:30:00Z"
}
```

#### Annuler un rendez-vous
**POST** `/appointments/{id}/cancel/`

#### Rendez-vous à venir
**GET** `/appointments/upcoming/`

#### Historique
**GET** `/appointments/history/`

### 📄 Demandes (Applications)

#### Liste des demandes
**GET** `/applications/`

**Query Parameters:**
- `status`: DRAFT, SUBMITTED, UNDER_REVIEW, etc.
- `application_type`: VISA, PASSPORT, etc.

#### Créer une demande
**POST** `/applications/`

```json
{
  "application_type": "VISA",
  "service_type": 1,
  "office": 1,
  "applicant_notes": "Notes",
  "visa_details": {
    "visa_type": "TOURIST",
    "purpose_of_visit": "Tourisme",
    "intended_entry_date": "2025-12-01",
    "intended_departure_date": "2025-12-15",
    "duration_days": 14,
    "destination_city": "Brazzaville"
  },
  "document_ids": [1, 2, 3]
}
```

**Response 201**
```json
{
  "id": 1,
  "reference_number": "APP-XYZ98765",
  "application_type": "VISA",
  "service_name": "Visa Tourisme",
  "status": "DRAFT",
  "total_fee": 50000,
  "is_paid": false,
  "created_at": "2025-10-12T14:30:00Z"
}
```

#### Soumettre une demande
**POST** `/applications/{id}/submit/`

#### Annuler une demande
**POST** `/applications/{id}/cancel/`

#### Brouillons
**GET** `/applications/drafts/`

#### En cours
**GET** `/applications/in_progress/`

#### Terminées
**GET** `/applications/completed/`

### 📎 Documents

#### Liste des documents
**GET** `/applications/documents/`

#### Téléverser un document
**POST** `/applications/documents/`

**Form Data:**
- `document_type`: PASSPORT, ID_CARD, PHOTO, etc.
- `file`: File (max 10MB, PDF/JPG/PNG)
- `description`: Optional description

**Response 201**
```json
{
  "id": 1,
  "document_type": "PASSPORT",
  "file_url": "https://...",
  "original_filename": "passport.pdf",
  "file_size": 1024000,
  "is_verified": false,
  "created_at": "2025-10-12T14:30:00Z"
}
```

### 💳 Paiements

#### Créer un paiement
**POST** `/payments/`

```json
{
  "application": 1,
  "payment_method": "STRIPE"
}
```

**Response 201**
```json
{
  "id": 1,
  "transaction_id": "TXN-ABC123456789",
  "amount": 50000,
  "currency": "XOF",
  "status": "PENDING",
  "created_at": "2025-10-12T14:30:00Z"
}
```

#### Créer Payment Intent Stripe
**POST** `/payments/{id}/create_stripe_intent/`

**Response**
```json
{
  "client_secret": "pi_xxx_secret_xxx",
  "publishable_key": "pk_live_xxx"
}
```

#### Confirmer un paiement
**POST** `/payments/{id}/confirm_payment/`

#### Historique des paiements
**GET** `/payments/my_payments/`

### 📢 Annonces

#### Liste des annonces
**GET** `/core/announcements/`

**Query Parameters:**
- `priority`: LOW, NORMAL, HIGH, URGENT
- `office`: Office ID

**Response**
```json
[
  {
    "id": 1,
    "title": "Fermeture exceptionnelle",
    "content": "L'ambassade sera fermée le...",
    "priority": "HIGH",
    "is_pinned": true,
    "publish_from": "2025-10-12T00:00:00Z",
    "publish_to": "2025-10-20T00:00:00Z"
  }
]
```

### ❓ FAQ

#### Liste des FAQs
**GET** `/core/faq/`

**Query Parameters:**
- `category`: VISA, PASSPORT, GENERAL, etc.

**Response**
```json
[
  {
    "id": 1,
    "category": "VISA",
    "category_display": "Visa",
    "question": "Combien de temps pour obtenir un visa ?",
    "answer": "Le délai standard est de 5 jours ouvrés..."
  }
]
```

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource introuvable |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

## Rate Limiting

- **Anonyme**: 100 requêtes/heure
- **Authentifié**: 1000 requêtes/heure

## Pagination

Les listes sont paginées par défaut (20 éléments/page).

**Query Parameters:**
- `page`: Numéro de page
- `page_size`: Taille de la page (max 100)

**Response**
```json
{
  "count": 42,
  "next": "https://.../api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

## Webhooks

### Stripe Payment Webhook

**POST** `/payments/webhook/`

Stripe envoie des événements à cette URL. Configurez-la dans votre dashboard Stripe.

Événements supportés:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

Pour plus d'informations, consultez le [Guide Utilisateur](USER_GUIDE.md).

