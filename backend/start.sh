#!/bin/bash
# Script de démarrage pour Render
# Exécute les migrations puis démarre Gunicorn

set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting Gunicorn..."
exec gunicorn embassy_backend.wsgi:application --bind 0.0.0.0:$PORT

