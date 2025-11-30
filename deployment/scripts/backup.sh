#!/bin/bash
# Backup script for Embassy PWA
# Run daily via cron: 0 2 * * * /home/webapp/embassy/deployment/scripts/backup.sh

set -e

PROJECT_DIR="/home/webapp/embassy"
BACKUP_DIR="/home/webapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="embassy_backup_$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

echo "🔒 Starting backup: $BACKUP_NAME"

# Database Backup
echo "📊 Backing up PostgreSQL database..."
sudo -u postgres pg_dump embassy_db | gzip > $BACKUP_DIR/${BACKUP_NAME}_db.sql.gz

# Media Files Backup
echo "📁 Backing up media files..."
tar -czf $BACKUP_DIR/${BACKUP_NAME}_media.tar.gz -C $PROJECT_DIR/backend media/

# Configuration Files Backup
echo "⚙️  Backing up configuration..."
tar -czf $BACKUP_DIR/${BACKUP_NAME}_config.tar.gz \
    $PROJECT_DIR/backend/.env \
    /etc/nginx/sites-available/embassy \
    /etc/systemd/system/gunicorn.service \
    /etc/systemd/system/django-q.service

# Upload to S3 (optional)
if [ ! -z "$AWS_S3_BACKUP_BUCKET" ]; then
    echo "☁️  Uploading to S3..."
    aws s3 cp $BACKUP_DIR/${BACKUP_NAME}_db.sql.gz s3://$AWS_S3_BACKUP_BUCKET/
    aws s3 cp $BACKUP_DIR/${BACKUP_NAME}_media.tar.gz s3://$AWS_S3_BACKUP_BUCKET/
    aws s3 cp $BACKUP_DIR/${BACKUP_NAME}_config.tar.gz s3://$AWS_S3_BACKUP_BUCKET/
fi

# Delete old backups (keep last 7 days)
echo "🗑️  Cleaning old backups..."
find $BACKUP_DIR -name "embassy_backup_*" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_NAME"
echo "📊 Backup size: $(du -sh $BACKUP_DIR/${BACKUP_NAME}_db.sql.gz | cut -f1)"

