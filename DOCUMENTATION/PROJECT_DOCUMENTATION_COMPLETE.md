# Documentation complète (extraction du code)

Ce document est une synthèse technique extraite directement du code source du projet (apps Django dans `backend/` et frontend React dans `frontend/`). Il vise à fournir au développeur ou à un agent IA une vue pratique et actionnable du projet : structure, flux de données, commandes clés, conventions, intégrations et exemples concrets.

---

## 1. Vue d'ensemble

Nom : PWA Ambassade du Congo au Sénégal

Composants principaux :
- Backend : Django 4.2 + Django REST Framework (API JSON)
- Frontend : React 18 + TypeScript, Vite (PWA)
- Tâches asynchrones : django-q (utilise la base de données comme broker par défaut)
- Stockage fichiers : `django-storages` + `boto3` (S3 compatible)
- Paiement : Stripe
- Email : SendGrid
- SMS : Twilio

Le backend implémente une structure par petites applications Django (apps) : `applications`, `appointments`, `core`, `users`, `payments`, `notifications`, etc. Chaque app suit la convention: `models.py`, `serializers.py`, `views.py`, `urls.py`, `tests.py`.

---

## 2. Composants et responsabilités (d'après le code)

Backend (répertoire `backend/`)
- `core/` : modèles d'infrastructure (ConsularOffice, ServiceType, Announcement, FAQ, AuditLog), utilitaires d'export (CSV/Excel), permissions et middleware.
- `applications/` : gestion des demandes consulaires (Application, Document, VisaApplication, PassportApplication), serializers, viewsets et logique métier (génération de référence, calcul de frais, transitions de statut).
- `appointments/` : créneaux et rendez-vous (Appointment, AppointmentSlot), génération QR code pour rendez-vous, logique d'annulation et de check-in.
- `notifications/` : tâches et utilitaires d'envoi (email, sms, push) — intégration avec django-q pour exécution asynchrone.
- `payments/` : modèles et endpoints liés aux paiements (Stripe + webhooks).


Frontend (répertoire `frontend/`)
- React + TypeScript, structure standard `src/` (composants, hooks, services).
- State: Zustand. API client: Axios + React Query. PWA: workbox/vite-plugin-pwa.

---

## Frontend — détails (extrait du code)

Ce projet frontend est construit avec React + TypeScript et utilise Vite comme bundler/dev server. Les points clés suivants ont été extraits directement des fichiers `frontend/` et `frontend/vite.config.ts` :

- Stack : React 18, TypeScript, Vite, TailwindCSS, Zustand, React Query, Axios, React Router.
- Tests : Vitest + Testing Library. Lint : ESLint (scripts dans `frontend/package.json`).

Commandes importantes (PowerShell) :

```powershell
cd frontend
npm install
npm run dev
npm run build
npm run preview
npm run test
npm run lint
```

Structure recommandée à ouvrir :
- `frontend/src/` — `components/`, `pages/`, `lib/`, `store/`, `main.tsx`.
- `vite.config.ts` — contient un bloc `VitePWA` commenté qui montre la manifest/workbox prévue (registerType: `autoUpdate`, runtimeCaching pour l'API).
- `.env` / `.env.example` — `VITE_API_URL` attendu (dev proxy `/api` → `http://localhost:8000`).

Patterns observés :
- Client API central (Axios) dans `src/lib/` et hooks React Query pour l'accès serveur.
- Zustand pour l'état global non persistant (UI/auth flags). Prioriser React Query pour l'état serveur.
- PWA : configuration présente mais désactivée par défaut. Pour l'activer, installer `vite-plugin-pwa` et décommenter le bloc dans `vite.config.ts`.

PWA / service worker notes :
- Le `vite.config.ts` contient une configuration Workbox commentée qui utilise `NetworkFirst` pour les appels API et un cache `api-cache` avec expiration 24h. Vérifier les URLs cibles avant activation.

Qualité & CI :
- CI doit exécuter `npm ci`, `npm run lint`, `npm run test -- --coverage`, `npm run build`.

Checklist rapide avant PR (frontend) :
1. `npm run lint`
2. `npm run test`
3. `npm run build` et `npm run preview`
4. Documenter toute nouvelle variable `VITE_*` dans `.env.example`.


## 3. Flux de données essentiels (exemples)

1) Soumission d'une demande (Application)
- Frontend assemble un payload JSON avec `application_type`, `service_type`, `office`, `document_ids`, et `visa_details` ou `passport_details` selon le type.
- Backend `ApplicationCreateSerializer` :
  - valide les sous-objets (`VisaApplicationSerializer`, `PassportApplicationSerializer`) et crée l'enregistrement `Application`.
  - assigne `applicant` à `request.user` et récupère `base_fee` depuis le `ServiceType`.
  - associe les `Document` fournis via `document_ids`.

2) Gestion des documents
- `Document` est uploadé via `DocumentViewSet` (MultiPartParser). Le `DocumentSerializer` valide taille et extension selon `settings.MAX_UPLOAD_SIZE` et `settings.ALLOWED_DOCUMENT_TYPES`.
- Les fichiers sont stockés via `FileField` avec `upload_to` (fonction `get_document_upload_path`) qui génère un nom UUID pour éviter les collisions et protéger l'original.

3) Rendez-vous et QR code
- `Appointment` crée un `reference_number` (format `APT-XXXXXXXX`) et un QR code image contenant un JSON structuré avec les infos du rendez-vous et de l'ambassade. Le QR est stocké dans `qr_code` (ImageField).
- Les vigiles peuvent scanner et vérifier un rendez-vous via `QRCodeScanViewSet.scan_qr_code`.

4) Transitions de statut
- `ApplicationViewSet.update_status` valide les transitions autorisées. Exemple de transitions valides (extrait du code):
  - `'DRAFT'` → `['SUBMITTED', 'CANCELLED']`
  - `'SUBMITTED'` → `['UNDER_REVIEW', 'REJECTED', 'CANCELLED']`
  - etc. Rejets et notes administratives sont gérées et consignées dans `AuditLog`.

---

## 4. Intégrations externes et points d'attention

- Stripe : paiements et webhooks (vérifier `payments/` pour details). Tester en mode test Stripe.
- SendGrid : envoi d'emails (templates et envois asynchrones via `notifications.tasks`).
- Twilio : SMS (rappels et notifications). Configs dans `.env`.
- S3 (via `django-storages` + `boto3`) : stockage des fichiers (documents, qrcodes). `settings` gère les endpoints.
- django-q : utilisé pour exécuter tâches en background (notify emails, génération de reçus, rappels). Par défaut la config peut être avec ORM broker (pas Redis).

Sécurité et bonnes pratiques observées :
- CSP, HSTS et autres protections sont mentionnées dans la doc; la base code propose `django-csp` et `django-axes`.
- Audit log central (`core.models.AuditLog`) utilisé pour tracer opérations sensibles (CREATE/UPDATE/DELETE, scans QR, paiements).

---

## 5. Commandes développeur utiles (extraits et vérifiées dans le repo)

Backend (PowerShell examples)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
pytest
black .
flake8 .
```

Frontend

```powershell
cd frontend
npm install
npm run dev
npm run build
npm run test
npm run lint
```

Notes:
- Tests backend : `pytest` (fichiers `backend/pytest.ini`, `conftest.py`).
- Frontend tests : Vitest (scripts dans `frontend/package.json`).

---

## 6. Conventions de code et patterns observés

- Apps Django : chaque app comporte `models.py`, `serializers.py`, `views.py`, `urls.py`, `tests.py`.
- Serializers DRF : la validation des sous-objets est effectuée manuellement (ex. `ApplicationCreateSerializer.validate` crée et valide `VisaApplicationSerializer`/`PassportApplicationSerializer`).
- Permissions : usage de classes personnalisées (`core.permissions.IsAdmin`, `IsVigile`, `core.permissions.IsAgent`) ; les viewsets utilisent `get_permissions()` pour adapter selon l'action.
- Logging/Audit : création d'objets `AuditLog` à chaque action significative (upload de document, création/soumission/annulation de demande, changements de statut, notifications).
- Uploads : `FileField` + `FileExtensionValidator` + taille max contrôlée via `settings.MAX_UPLOAD_SIZE`.
- Références et numéros : générés par `generate_reference_number()` dans `Application` et `Appointment` (formats `APP-...` et `APT-...`).

---

## 7. Exemples concrets extraits du code

1) Génération de QR code (extrait, résumé)

- Dans `appointments.models.Appointment.generate_qr_code()` le QR contient un JSON avec :
  - `type`, `reference`, `appointment` (id, date, time, service, office, user), `embassy` (contact), `generatedAt`, `validUntil`, `purpose`.
- Le QR est généré avec `qrcode` et sauvegardé dans `qr_code` (ImageField).

2) Validation de fichiers (extrait)

- `DocumentSerializer.validate_file` vérifie `settings.MAX_UPLOAD_SIZE` et `settings.ALLOWED_DOCUMENT_TYPES`. Rejette si la taille ou l'extension n'est pas permise.

3) Transitions de statut (extrait)

- `ApplicationViewSet.update_status` définit un dictionnaire `valid_transitions` qui liste les transitions acceptées par statut. Toute transition non valide renvoie 400.

4) Création d'application avec documents

- `ApplicationCreateSerializer.create()` :
  - enlève `visa_details`/`passport_details` et `document_ids` du validated_data,
  - assigne `applicant` depuis `request.user`,
  - définit `base_fee` depuis `service_type.base_fee`,
  - crée l'`Application`, associe les `Document` correspondants et crée les objets `VisaApplication` ou `PassportApplication` liés.

---

## 8. Tests et qualité

- Backend : `pytest` est utilisé (voir `backend/pytest.ini`). Plusieurs tests existent (`test_gmail.py`, `test_notifications.py`, `test_registration_email.py`, etc.).
- Formatage et lint : `black`, `flake8` pour Python ; `eslint`, `prettier` et `vitest` pour frontend.

---

## 9. Déploiement et opérations (repères)

- Le dépôt contient un dossier `deployment/` avec scripts, configuration `nginx/` et `systemd/` pour déployer en production (Let’s Encrypt, systemd services `gunicorn`, `django-q`).
- Sauvegardes : scripts de backup/restore et répertoire `backups` sont documentés dans README et `docs/`.
- Logs : les chemins de logs (gunicorn/nginx) et commandes systemctl sont dans `README.md`.

---

## 10. Points d'amélioration / éléments à vérifier (observations)

- Configuration des environnements : vérifier que `.env.example` existe et liste les variables (STRIPE, SENDGRID, TWILIO, AWS keys).
- django-q en mode ORM est acceptable pour petites installations ; pour montée en charge prévoir Redis/RabbitMQ.
- Certaines fonctions d'export/CSV/XLSX utilisent des bibliothèques lourdes (weasyprint, reportlab) — vérifier disponibilité en build CI.
- Tests d'intégration pour webhooks Stripe et tâches asynchrones pourraient être renforcés.

---

## 11. Où commencer pour ajouter une fonctionnalité

1. Ouvrir l'app concernée dans `backend/<app>/` et identifier `models.py`, `serializers.py`, `views.py`, `tests.py`.
2. Ajouter les modèles/migrations si nécessaire (`python manage.py makemigrations`).
3. Ajouter/mettre à jour serializers pour valider les payloads API.
4. Ajouter viewsets/endpoints et tests unitaires (pytest). Consigner les actions significatives dans `AuditLog`.
5. Si fichiers uploadés, respecter `Document` pattern (UUID filename, validators, settings.MAX_UPLOAD_SIZE).
6. Pour le frontend, modifier `frontend/src/` composants + services (axios/react-query) et ajouter tests Vitest.

---

## 12. Fichiers clés à ouvrir immédiatement

- `backend/manage.py`
- `backend/requirements.txt`
- `backend/embassy_backend/settings.py` (config et variables d'environnement)
- `backend/applications/models.py`, `serializers.py`, `views.py`
- `backend/appointments/models.py` (QR generation)
- `backend/core/models.py` (AuditLog, ServiceType, ConsularOffice)
- `frontend/package.json` et `frontend/src/` (API client patterns)
- `README.md`, `START_HERE.md`, `docs/DEPLOYMENT.md`

---

## 13. Contact & bonnes pratiques pour PR

- Inclure migrations si modèles modifiés.
- Ajouter tests (backend pytest, frontend vitest) et exécuter les linters.
- Ne jamais placer de clés secrètes dans les PR; utiliser `.env.example` pour exemples.

---

Si vous souhaitez, je peux :
- extraire et ajouter de courts extraits de code (5–15 lignes) pour illustrer la création d'une `Application`, la génération de QR ou la validation d'upload,
- générer un guide de démarrage local détaillé (PowerShell + Windows) avec commandes exactes et `.env.example` minimal,
- ou traduire/mettre en forme ce document en Markdown différent (README style) pour inclusion dans le repo.

Fin de la synthèse extraite du code.
