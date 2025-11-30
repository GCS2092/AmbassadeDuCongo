# Script de démarrage pour accès mobile sur le réseau local
# Détecte automatiquement l'IP et configure tout

Write-Host "🚀 DÉMARRAGE POUR ACCÈS MOBILE" -ForegroundColor Green
Write-Host ""

# Détecter l'IP locale automatiquement
Write-Host "🔍 Détection de l'IP locale..." -ForegroundColor Yellow
try {
    $ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.IPAddress -like "192.168.*" -or 
        $_.IPAddress -like "10.*" -or 
        ($_.IPAddress -like "172.*" -and $_.IPAddress -match "^172\.(1[6-9]|2[0-9]|3[01])\.")
    }
    
    if ($ipAddresses) {
        $localIP = ($ipAddresses | Select-Object -First 1).IPAddress
        Write-Host "✅ IP détectée: $localIP" -ForegroundColor Green
    } else {
        Write-Host "⚠️ IP réseau non détectée, utilisation de 192.168.1.2" -ForegroundColor Yellow
        Write-Host "   Vous pouvez modifier cette IP dans le script si nécessaire" -ForegroundColor Gray
        $localIP = "192.168.1.2"
    }
} catch {
    Write-Host "⚠️ Erreur lors de la détection, utilisation de 192.168.1.2" -ForegroundColor Yellow
    Write-Host "   Vous pouvez modifier cette IP dans le script si nécessaire" -ForegroundColor Gray
    $localIP = "192.168.1.2"
}

Write-Host ""
Write-Host "🛑 Arrêt des processus existants..." -ForegroundColor Yellow
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*runserver*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Créer/mettre à jour .env.local avec l'IP détectée
Write-Host "📝 Configuration de l'API URL..." -ForegroundColor Yellow
$envContent = "VITE_API_URL=http://$localIP:8000/api`n"
$envFile = "frontend\.env.local"
$envContent | Out-File -FilePath $envFile -Encoding utf8 -Force
Write-Host "✅ Fichier .env.local mis à jour avec IP: $localIP" -ForegroundColor Green

# Démarrer le backend Django
Write-Host ""
Write-Host "🐍 Démarrage du backend Django sur 0.0.0.0:8000..." -ForegroundColor Cyan
Set-Location backend

# Activer l'environnement virtuel
if (Test-Path "venv\Scripts\Activate.ps1") {
    & ".\venv\Scripts\Activate.ps1"
}

# Démarrer Django en arrière-plan avec 0.0.0.0 pour accepter les connexions réseau
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\Activate.ps1; `$env:ALLOWED_HOSTS='localhost,127.0.0.1,$localIP,*'; python manage.py runserver 0.0.0.0:8000"
Set-Location ..

# Attendre que le backend démarre
Start-Sleep -Seconds 5

# Démarrer le frontend Vite
Write-Host "⚛️ Démarrage du frontend Vite sur 0.0.0.0:3000..." -ForegroundColor Cyan
Set-Location frontend

# Démarrer Vite en arrière-plan avec host 0.0.0.0 pour accepter les connexions réseau
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev -- --host 0.0.0.0 --port 3000"
Set-Location ..

# Attendre que les serveurs démarrent
Write-Host ""
Write-Host "⏳ Attente du démarrage des serveurs (15 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test de connectivité
Write-Host ""
Write-Host "🔍 Test de connectivité..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://$localIP:8000/api/core/service-types/" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend accessible sur http://$localIP:8000" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend non accessible sur http://$localIP:8000 (peut être normal si pas encore démarré)" -ForegroundColor Yellow
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://$localIP:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend accessible sur http://$localIP:3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend non accessible sur http://$localIP:3000 (peut être normal si pas encore démarré)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   SERVICES DÉMARRÉS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 ACCÈS LOCAL (PC):" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "📱 ACCÈS RÉSEAU (MOBILE):" -ForegroundColor Magenta
Write-Host "   Frontend: http://$localIP:3000" -ForegroundColor White
Write-Host "   Backend:  http://$localIP:8000" -ForegroundColor White
Write-Host ""
Write-Host "📋 INSTRUCTIONS POUR MOBILE:" -ForegroundColor Yellow
Write-Host "   1. Assurez-vous que votre téléphone est sur le MÊME réseau WiFi" -ForegroundColor White
Write-Host "   2. Ouvrez un navigateur sur votre téléphone" -ForegroundColor White
Write-Host "   3. Entrez: http://$localIP:3000" -ForegroundColor Cyan
Write-Host "   4. Si ça ne fonctionne pas, vérifiez le firewall Windows" -ForegroundColor White
Write-Host ""
Write-Host "🔧 COMPTES DE TEST:" -ForegroundColor Yellow
Write-Host "   Admin:  slovengama@gmail.com / password123" -ForegroundColor White
Write-Host "   Vigile: Stemk2151@gmail.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  FIREWALL:" -ForegroundColor Red
Write-Host "   Si ça ne fonctionne pas, autorisez les ports 3000 et 8000 dans le firewall Windows" -ForegroundColor Yellow
Write-Host "   Commande: netsh advfirewall firewall add rule name='Ambassade Frontend' dir=in action=allow protocol=TCP localport=3000" -ForegroundColor Gray
Write-Host "   Commande: netsh advfirewall firewall add rule name='Ambassade Backend' dir=in action=allow protocol=TCP localport=8000" -ForegroundColor Gray
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

