#!/bin/bash
# Deployment script for Embassy PWA
# Usage: ./deploy.sh

set -e

PROJECT_DIR="/home/webapp/embassy"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV_DIR="$PROJECT_DIR/venv"

echo "🚀 Starting deployment..."

# Update code from git
echo "📥 Pulling latest code..."
cd $PROJECT_DIR
git pull origin main

# Backend Deployment
echo "🔧 Deploying backend..."
cd $BACKEND_DIR

# Activate virtualenv
source $VENV_DIR/bin/activate

# Install/update dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt --upgrade

# Run migrations
echo "🗃️  Running database migrations..."
python manage.py migrate --no-input

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --no-input --clear

# Frontend Deployment
echo "⚛️  Deploying frontend..."
cd $FRONTEND_DIR

# Install dependencies
echo "📦 Installing Node dependencies..."
npm ci

# Build production
echo "🏗️  Building frontend..."
npm run build

# Restart services
echo "🔄 Restarting services..."
sudo systemctl restart gunicorn
sudo systemctl restart django-q
sudo systemctl reload nginx

# Check service status
echo "✅ Checking service status..."
sudo systemctl is-active --quiet gunicorn && echo "Gunicorn: ✅ Running" || echo "Gunicorn: ❌ Failed"
sudo systemctl is-active --quiet django-q && echo "Django-Q: ✅ Running" || echo "Django-Q: ❌ Failed"
sudo systemctl is-active --quiet nginx && echo "Nginx: ✅ Running" || echo "Nginx: ❌ Failed"

echo "🎉 Deployment completed successfully!"
echo "📊 Deployment time: $(date)"

