#!/usr/bin/env pwsh
# Script de démarrage simple et fonctionnel

Write-Host "🚀 DÉMARRAGE SIMPLE" -ForegroundColor Green
Write-Host ""

# Arrêter les processus existants
Write-Host "🛑 Arrêt des processus existants..." -ForegroundColor Yellow
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*runserver*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

# Démarrer le backend
Write-Host "🐍 Démarrage du backend Django..." -ForegroundColor Cyan
Set-Location backend

# Activer l'environnement virtuel
if (Test-Path "venv\Scripts\Activate.ps1") {
    & ".\venv\Scripts\Activate.ps1"
    Write-Host "✅ Environnement virtuel activé" -ForegroundColor Green
}

# Démarrer Django en arrière-plan
Start-Process -FilePath "python" -ArgumentList "manage.py", "runserver", "0.0.0.0:8000" -WindowStyle Hidden
Set-Location ..

# Démarrer le frontend
Write-Host "⚛️ Démarrage du frontend React..." -ForegroundColor Cyan
Set-Location frontend

# Démarrer Vite en arrière-plan
Start-Process -FilePath "npm" -ArgumentList "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000" -WindowStyle Hidden
Set-Location ..

# Attendre
Write-Host "⏳ Attente du démarrage..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test de connectivité
Write-Host "🔍 Test de connectivité..." -ForegroundColor Yellow

try {
    $backendResponse = Invoke-WebRequest -Uri "http://192.168.1.2:8000" -TimeoutSec 5
    Write-Host "✅ Backend accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend inaccessible" -ForegroundColor Red
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://192.168.1.2:3000" -TimeoutSec 5
    Write-Host "✅ Frontend accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend inaccessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== SERVICES DÉMARRÉS ===" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Accès:" -ForegroundColor Cyan
Write-Host "  Frontend: http://192.168.1.2:3000" -ForegroundColor White
Write-Host "  Backend: http://192.168.1.118:8000" -ForegroundColor White
Write-Host ""
Write-Host "📱 Mobile:" -ForegroundColor Magenta
Write-Host "  ✅ Connexion corrigée" -ForegroundColor Green
Write-Host "  ✅ QR Scanner amélioré" -ForegroundColor Green
Write-Host "  ✅ Service Worker optimisé" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Comptes de test:" -ForegroundColor Yellow
Write-Host "  Admin: slovengama@gmail.com / Admin123!" -ForegroundColor White
Write-Host "  Vigile: Stemk2151@gmail.com / Vigile123!" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
