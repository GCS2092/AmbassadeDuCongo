#!/bin/bash
# Initial setup script for Embassy PWA on Ubuntu
# Run this once on a fresh server

set -e

echo "🚀 Embassy PWA - Initial Server Setup"
echo "======================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    postgresql \
    postgresql-contrib \
    nginx \
    certbot \
    python3-certbot-nginx \
    nodejs \
    npm \
    git \
    curl \
    supervisor

# Create webapp user
echo "👤 Creating webapp user..."
if ! id "webapp" &>/dev/null; then
    sudo useradd -m -s /bin/bash webapp
    sudo usermod -aG www-data webapp
fi

# Setup PostgreSQL
echo "🗃️  Setting up PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE DATABASE embassy_db;
CREATE USER embassy_user WITH PASSWORD 'change_this_password';
ALTER ROLE embassy_user SET client_encoding TO 'utf8';
ALTER ROLE embassy_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE embassy_user SET timezone TO 'Africa/Dakar';
GRANT ALL PRIVILEGES ON DATABASE embassy_db TO embassy_user;
EOF

# Create project directories
echo "📁 Creating project directories..."
sudo -u webapp mkdir -p /home/webapp/embassy
sudo -u webapp mkdir -p /home/webapp/backups
sudo mkdir -p /var/log/gunicorn

# Clone repository (you'll need to update this URL)
echo "📥 Cloning repository..."
cd /home/webapp
# sudo -u webapp git clone https://github.com/your-org/embassy-pwa.git embassy

# Setup Python virtual environment
echo "🐍 Setting up Python virtual environment..."
cd /home/webapp/embassy
sudo -u webapp python3 -m venv venv
sudo -u webapp /home/webapp/embassy/venv/bin/pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd /home/webapp/embassy/backend
sudo -u webapp /home/webapp/embassy/venv/bin/pip install -r requirements.txt

# Create .env file
echo "⚙️  Creating environment file..."
sudo -u webapp cp /home/webapp/embassy/backend/.env.example /home/webapp/embassy/backend/.env
echo "⚠️  Please edit /home/webapp/embassy/backend/.env with your settings!"

# Run Django migrations
echo "🗃️  Running Django migrations..."
cd /home/webapp/embassy/backend
sudo -u webapp /home/webapp/embassy/venv/bin/python manage.py migrate

# Create Django superuser
echo "👤 Creating Django superuser..."
echo "Please enter superuser details:"
sudo -u webapp /home/webapp/embassy/venv/bin/python manage.py createsuperuser

# Collect static files
echo "📁 Collecting static files..."
sudo -u webapp /home/webapp/embassy/venv/bin/python manage.py collectstatic --no-input

# Setup Nginx
echo "🌐 Setting up Nginx..."
sudo cp /home/webapp/embassy/deployment/nginx/embassy.conf /etc/nginx/sites-available/embassy
sudo ln -sf /etc/nginx/sites-available/embassy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup systemd services
echo "⚙️  Setting up systemd services..."
sudo cp /home/webapp/embassy/deployment/systemd/gunicorn.socket /etc/systemd/system/
sudo cp /home/webapp/embassy/deployment/systemd/gunicorn.service /etc/systemd/system/
sudo cp /home/webapp/embassy/deployment/systemd/django-q.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable gunicorn.socket
sudo systemctl enable gunicorn.service
sudo systemctl enable django-q.service
sudo systemctl start gunicorn.socket
sudo systemctl start gunicorn.service
sudo systemctl start django-q.service

# Setup SSL with Let's Encrypt
echo "🔒 Setting up SSL certificate..."
echo "⚠️  Make sure your domain is pointing to this server!"
read -p "Enter your domain name (e.g., embassy.example.tld): " DOMAIN
sudo certbot --nginx -d $DOMAIN

# Setup cron for backups
echo "⏰ Setting up backup cron job..."
(crontab -u webapp -l 2>/dev/null; echo "0 2 * * * /home/webapp/embassy/deployment/scripts/backup.sh") | crontab -u webapp -

# Install frontend dependencies and build
echo "⚛️  Setting up frontend..."
cd /home/webapp/embassy/frontend
sudo -u webapp npm install
sudo -u webapp npm run build

# Make scripts executable
chmod +x /home/webapp/embassy/deployment/scripts/*.sh

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Edit /home/webapp/embassy/backend/.env with your settings"
echo "2. Update Nginx configuration with your domain"
echo "3. Configure firewall: sudo ufw allow 'Nginx Full'"
echo "4. Check service status:"
echo "   - sudo systemctl status gunicorn"
echo "   - sudo systemctl status django-q"
echo "   - sudo systemctl status nginx"
echo ""
echo "🌐 Access your application at: https://$DOMAIN"
echo "🔐 Admin panel: https://$DOMAIN/admin"

