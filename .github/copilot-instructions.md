<!--
Brief, project-specific instructions to help AI coding agents be immediately productive.
Keep this file ~20-50 lines. Only document observable patterns and concrete commands.
-->
# Copilot / AI assistant instructions — Embassy PWA

Target: quickly make useful backend/frontend edits, tests and small features. Focus on the Django backend in `backend/` and the React + Vite frontend in `frontend/`.

1. Project layout & big picture
   - `backend/` is a Django 4.2 + DRF monolith. Apps live under `backend/` (e.g. `applications/`, `appointments/`, `core/`, `users/`). Each app commonly provides `models.py`, `serializers.py`, `views.py`, `urls.py`, and `tests.py`.
   - `frontend/` is a React + TypeScript PWA built with Vite (scripts in `frontend/package.json`). API client uses Axios + React Query; state uses Zustand.
   - Integration points: Stripe (payments/webhooks), SendGrid (email), Twilio (SMS), S3-compatible storage via `django-storages` + `boto3`, django-q for background jobs. Environment variables are read via `python-decouple` (.env files recommended).

2. Developer workflows (concrete commands)
   - Backend dev (Windows PowerShell example):
     - python -m venv .venv; .\.venv\Scripts\Activate.ps1
     - pip install -r backend/requirements.txt
     - cd backend; python manage.py migrate; python manage.py runserver
   - Frontend dev:
     - cd frontend; npm install; npm run dev
   - Tests:
     - Backend: from repo root `cd backend && pytest` (config in `backend/pytest.ini`).
     - Frontend: `cd frontend && npm run test` (uses Vitest).
   - Lint/format:
     - Backend: `black .` and `flake8 .` (requirements include these tools).
     - Frontend: `cd frontend && npm run lint` (ESLint configured in package.json).

3. Patterns & conventions worth following
   - Per-app structure: most features are implemented inside small Django apps. To add a feature, create/update `models.py`, `serializers.py`, `views.py` and `urls.py` in that app and add tests to `tests.py`.
   - Signals: `signals.py` is used for side-effects (look at `backend/*/signals.py`). Prefer small, testable signal handlers.
   - Background work: django-q is used (no Redis by default). Long-running or retryable jobs should be queued via django-q tasks.
   - Settings and secrets: backend uses `embassy_backend.settings` (set `DJANGO_SETTINGS_MODULE` via `manage.py`); secrets come from environment variables (.env). Do not hard-code credentials.

4. Where to look for examples
   - Dev entrypoint: `backend/manage.py` (standard Django CLI).
   - Dependency list: `backend/requirements.txt` (shows used libraries: DRF, simplejwt, django-allauth, django-q, boto3, stripe, sendgrid, twilio, weasyprint, pytest etc.).
   - Frontend scripts & test runner: `frontend/package.json`.
   - High-level docs and workflows: `README.md`, `START_HERE.md`, and files under `docs/` (e.g. `docs/DEPLOYMENT.md`) — these contain deployment and operational guidance.

5. Quick editing / PR tips for AI changes
   - Keep DB migrations minimal; if you add/modify models include `python manage.py makemigrations` and include migration files in PR.
   - Add or update tests for the backend in the app's `tests.py` and run `pytest` locally.
   - For frontend changes, prefer small component/unit updates and run `npm run test` + `npm run lint`.
   - When touching integration points (webhooks, storage, payments), include clear docs in PR and stub credentials in `.env.example` rather than real secrets.

6. Files of interest to open first
   - `backend/manage.py`, `backend/pytest.ini`, `backend/embassy_backend/settings.py`
   - Any target app: `backend/<app>/models.py`, `serializers.py`, `views.py`, `urls.py`, `tests.py`
   - `frontend/package.json`, `frontend/src/**` for React components
   - `README.md`, `START_HERE.md`, `docs/DEPLOYMENT.md`

If a section above is unclear or you need examples from a specific app (e.g. how a webhook or a background task is implemented), tell me which area and I will extract short code examples to include in this file.
