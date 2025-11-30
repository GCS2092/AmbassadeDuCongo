#!/usr/bin/env pwsh
# Script PowerShell pour démarrer les serveurs Django et React

Write-Host "=== DEMARRAGE DES SERVEURS AMBASSADE DU CONGO ===" -ForegroundColor Green
Write-Host ""

# Vérifier si Python est installé
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python détecté: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Python n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Node.js n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Activer l'environnement virtuel Python
Write-Host "Activation de l'environnement virtuel Python..." -ForegroundColor Yellow
if (Test-Path "backend\venv\Scripts\Activate.ps1") {
    & "backend\venv\Scripts\Activate.ps1"
    Write-Host "Environnement virtuel activé" -ForegroundColor Green
} else {
    Write-Host "ATTENTION: Environnement virtuel non trouvé dans backend\venv\" -ForegroundColor Yellow
    Write-Host "Assurez-vous d'avoir créé l'environnement virtuel avec: python -m venv backend\venv" -ForegroundColor Yellow
}

Write-Host ""

# Démarrer Django en arrière-plan
Write-Host "Démarrage du serveur Django..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python manage.py runserver 0.0.0.0:8000" -WindowStyle Normal

# Attendre un peu pour que Django démarre
Start-Sleep -Seconds 3

# Démarrer React en arrière-plan
Write-Host "Démarrage du serveur React..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

# Attendre un peu pour que React démarre
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=== SERVEURS DEMARRES ===" -ForegroundColor Green
Write-Host ""
Write-Host "Backend Django: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend React: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📱 Accès mobile: Remplacez 'localhost' par votre IP locale" -ForegroundColor Magenta
Write-Host ""
Write-Host "COMPTES DE TEST:" -ForegroundColor Magenta
Write-Host "ADMIN:" -ForegroundColor Magenta
Write-Host "  Email: slovengama@gmail.com" -ForegroundColor White
Write-Host "  Mot de passe: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "VIGILE:" -ForegroundColor Magenta
Write-Host "  Email: Stemk2151@gmail.com" -ForegroundColor White
Write-Host "  Mot de passe: Vigile123!" -ForegroundColor White
Write-Host ""
Write-Host "INTERFACES:" -ForegroundColor Cyan
Write-Host "  Dashboard: http://localhost:3000/dashboard" -ForegroundColor Cyan
Write-Host "  Admin Panel: http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host "  Scanner QR: http://localhost:3000/security/scanner" -ForegroundColor Cyan
Write-Host "  Mon Ambassade: Section QR Code sur le dashboard" -ForegroundColor Magenta
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")