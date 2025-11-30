# Script PowerShell pour corriger les champs Profile
Write-Host "🔧 Correction des champs Profile..." -ForegroundColor Cyan

# Aller dans le dossier backend
Set-Location backend

# Créer la migration
Write-Host "📝 Création de la migration..." -ForegroundColor Yellow
python manage.py makemigrations users --name add_null_to_encrypted_fields

# Appliquer la migration
Write-Host "🚀 Application de la migration..." -ForegroundColor Yellow
python manage.py migrate users

Write-Host "✅ Migration terminée !" -ForegroundColor Green

# Retour au dossier racine
Set-Location ..

