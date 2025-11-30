#!/bin/bash
# Script de démarrage pour Render
# Exécute les migrations puis démarre Gunicorn

set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating Django site if needed..."
python manage.py shell << EOF
from django.contrib.sites.models import Site
Site.objects.get_or_create(
    id=1,
    defaults={
        'domain': 'ambassade-backend.onrender.com',
        'name': 'Ambassade du Congo'
    }
)
EOF

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting Gunicorn..."
exec gunicorn embassy_backend.wsgi:application --bind 0.0.0.0:$PORT

