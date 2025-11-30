# Documentation frontend — PWA Ambassade (extraction du code)

Ce document fournit une vue complète et actionnable du frontend, extraite directement du code et des configurations présentes dans `frontend/`.

## Vue d'ensemble

- Framework : React 18 + TypeScript
- Bundler / dev server : Vite
- Styling : TailwindCSS
- State : Zustand
- Data fetching / caching : Axios + @tanstack/react-query
- PWA : (configurable via `vite-plugin-pwa`, présente mais commentée dans `vite.config.ts`)
- Tests : Vitest + Testing Library
- Lint : ESLint (préconfiguré dans `package.json`)

## Commandes utiles (PowerShell)

```powershell
# Install
cd frontend
npm install

# Dev server (vite)
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Tests
npm run test

# Lint
npm run lint
```

Le fichier `frontend/package.json` contient les scripts listés ci‑dessus (`dev`, `build`, `preview`, `lint`, `test`, `test:ui`, `test:coverage`).

## Fichiers et structure à connaître

- `frontend/src/`
  - `components/` : composants réutilisables (UI)
  - `pages/` : pages / routes
  - `lib/` : utilitaires et configuration (typiquement client Axios, helpers)
  - `store/` : stores Zustand (état global)
  - `main.tsx` : point d'entrée, configuration React Query Provider, router, worker registration si présent
- `frontend/index.html` : template HTML initial
- `vite.config.ts` : configuration Vite (proxy / server / plugin PWA commenté)
- `tailwind.config.js` : configuration Tailwind
- `.env` / `.env.example` : variables d'environnement (notamment `VITE_API_URL`)

## API client & patterns observés

- API base URL is provided via `VITE_API_URL` (frontend README and `.env` example). In dev, Vite proxy forwards `/api` → `http://localhost:8000`.
- Pattern: central Axios instance in `src/lib/` used by React Query hooks. When adding API calls:
  1. Add an axios call in `src/lib/api.ts` (or similar)
  2. Create a React Query hook `useX` in `src/lib/queries.ts` or next to the component
  3. Consume in components/pages with `useQuery` / `useMutation`

Exemple simplifié (à adapter au projet):

```ts
// src/lib/api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true
})

// src/lib/queries.ts
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export function useApplications() {
  return useQuery(['applications'], async () => {
    const { data } = await api.get('/applications/')
    return data
  })
}
```

## State management

- Zustand is used for local/global state (auth UI flags, ephemeral UI state). Keep stores small and focused (one store per domain if complex).
- For server state (data from backend), prefer React Query — use mutations for POST/PUT/PATCH and invalidate queries after success.

## PWA configuration (workbox / vite-plugin-pwa)

- `vite.config.ts` contains a commented `VitePWA` block that shows the intended manifest and runtimeCaching strategy.
- Key points from the commented config:
  - registerType: `autoUpdate`
  - includeAssets: favicon, robots, icons
  - manifest: name, short_name, icons with maskable purpose
  - workbox runtimeCaching: example `NetworkFirst` strategy for API calls (`https://api.embassy.example.tld/.*`), cache name `api-cache`, expiration 24h

If you want the PWA active in dev/production, uncomment and fine-tune that block and ensure the `vite-plugin-pwa` package is installed.

## Styling

- Tailwind is configured (`tailwind.config.js`) — utility-first approach. Modify theme or add components in `src/styles/` or `src/components/`.

## Tests & quality

- Unit / component tests: Vitest + Testing Library. Use `npm run test` for headless; `npm run test:ui` to open UI runner.
- Linting: `npm run lint` (ESLint). Enforce in PRs.

## Build & CI considerations

- Ensure Node.js version compatible with `package.json` (documented in README). CI should run:
  - `npm ci`
  - `npm run lint`
  - `npm run test -- --coverage` (if coverage required)
  - `npm run build`

## Debugging tips

- Use Vite's dev server (fast HMR). Open browser console to inspect network requests to `/api` and validate `VITE_API_URL` or proxy settings.
- To debug service worker/PWA issues, use Chrome DevTools → Application → Service Workers and unregister for local development if needed.

## Where to edit for common tasks

- Add a new page: `src/pages/NewFeaturePage.tsx`, add route in router setup (likely in `main.tsx` or `src/router/*`).
- Add API endpoint: `src/lib/api.ts` then hook in `src/lib/queries.ts` and use in component.
- Global UI state: `src/store/` (Zustand stores). Keep async server state in React Query.

## Small checklist before PR (frontend)

1. Lint & format: `npm run lint`
2. Run tests: `npm run test` (or `npm run test:ui` to visually inspect)
3. Build locally: `npm run build` and optionally `npm run preview` to test production bundle
4. Update docs: add README or notes if you added new env vars (`VITE_*`)

---

Si vous voulez que j'ajoute des extraits concrets directement depuis `frontend/src/` (par ex. le store Zustand principal, l'instance axios exacte, ou un composant de page), dites-moi quel fichier ou dossier précis et je l'extrais et l'insère ici.
