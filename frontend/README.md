# Embassy PWA - Frontend

Application web progressive (PWA) pour les services consulaires de l'Ambassade du Congo au Sénégal.

## Technologies

- React 18
- TypeScript
- Vite
- TailwindCSS
- React Query
- Zustand (state management)
- React Router
- Workbox (PWA)

## Installation

```bash
npm install
```

## Configuration

Copiez `.env.example` vers `.env` et configurez l'URL de l'API :

```env
VITE_API_URL=http://localhost:8000/api
```

## Développement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## Build

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`

## Features

- ✅ PWA (fonctionne hors ligne)
- ✅ Responsive design
- ✅ Authentification JWT
- ✅ Gestion des rendez-vous
- ✅ Suivi des demandes
- ✅ Paiement en ligne
- ✅ Notifications push
- ✅ QR codes pour rendez-vous

## Structure

```
src/
├── components/     # Composants réutilisables
├── pages/         # Pages de l'application
├── lib/           # Utilitaires et configuration API
├── store/         # State management (Zustand)
└── main.tsx       # Point d'entrée
```

