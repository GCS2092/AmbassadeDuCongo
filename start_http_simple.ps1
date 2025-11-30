# Script de demarrage HTTP simple (sans HTTPS)
# Demarre le backend Django et le frontend Vite en HTTP

Write-Host "Demarrage de l'application en HTTP..." -ForegroundColor Green

# Verifier que nous sommes dans le bon repertoire
if (-not (Test-Path "backend" -PathType Container)) {
    Write-Host "Erreur: Repertoire 'backend' non trouve" -ForegroundColor Red
    Write-Host "Assurez-vous d'etre dans le repertoire racine du projet" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "frontend" -PathType Container)) {
    Write-Host "Erreur: Repertoire 'frontend' non trouve" -ForegroundColor Red
    Write-Host "Assurez-vous d'etre dans le repertoire racine du projet" -ForegroundColor Yellow
    exit 1
}

# Obtenir l'IP locale
try {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*" } | Select-Object -First 1).IPAddress
    if (-not $ip) {
        $ip = "192.168.1.2"
    }
} catch {
    $ip = "192.168.1.2"
}

Write-Host "IP locale detectee: $ip" -ForegroundColor Cyan

# Demarrer le backend Django
Write-Host "Demarrage du backend Django..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; .\venv\Scripts\Activate.ps1; python manage.py runserver 0.0.0.0:8000"

# Attendre 3 secondes
Start-Sleep -Seconds 3

# Demarrer le frontend Vite
Write-Host "Demarrage du frontend Vite..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev -- --host 0.0.0.0 --port 3000"

# Attendre 5 secondes
Start-Sleep -Seconds 5

# Afficher les informations
Write-Host "Application demarree en HTTP!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs d'acces:" -ForegroundColor Cyan
Write-Host "   Local:    http://localhost:3000" -ForegroundColor White
Write-Host "   Reseau:   http://$ip:3000" -ForegroundColor White
Write-Host ""
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour acceder depuis mobile:" -ForegroundColor Cyan
Write-Host "   Ouvrez: http://$ip:3000" -ForegroundColor White
Write-Host ""
Write-Host "ATTENTION: Sans HTTPS, la camera ne fonctionnera pas sur Safari!" -ForegroundColor Red
Write-Host "Pour la camera, utilisez Chrome ou Firefox sur mobile" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pour arreter: Fermez les fenetres PowerShell" -ForegroundColor Red
