# Script PowerShell pour démarrer les serveurs avec accès mobile
# Détecte automatiquement l'IP locale et configure les serveurs

Write-Host "=== DEMARRAGE DES SERVEURS POUR ACCES MOBILE ===" -ForegroundColor Green
Write-Host ""

# Fonction pour obtenir l'IP locale
function Get-LocalIP {
    try {
        # Obtenir toutes les interfaces réseau IPv4
        $interfaces = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
            $_.IPAddress -notlike "127.*" -and 
            $_.IPAddress -notlike "169.254.*" -and
            ($_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*")
        }
        
        if ($interfaces) {
            $ip = ($interfaces | Select-Object -First 1).IPAddress
            Write-Host "IP locale detectee: $ip" -ForegroundColor Cyan
            return $ip
        } else {
            Write-Host "Aucune IP locale detectee, utilisation de 192.168.1.100" -ForegroundColor Yellow
            return "192.168.1.100"
        }
    } catch {
        Write-Host "Erreur lors de la detection de l'IP, utilisation de 192.168.1.100" -ForegroundColor Yellow
        return "192.168.1.100"
    }
}

# Obtenir l'IP locale
$localIP = Get-LocalIP
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "backend" -PathType Container)) {
    Write-Host "ERREUR: Repertoire 'backend' non trouve" -ForegroundColor Red
    Write-Host "Assurez-vous d'etre dans le repertoire racine du projet" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "frontend" -PathType Container)) {
    Write-Host "ERREUR: Repertoire 'frontend' non trouve" -ForegroundColor Red
    Write-Host "Assurez-vous d'etre dans le repertoire racine du projet" -ForegroundColor Yellow
    exit 1
}

# Vérifier Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python detecte: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Python n'est pas installe ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Node.js detecte: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Node.js n'est pas installe ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Configurer les variables d'environnement pour Django
$env:ALLOWED_HOSTS = "localhost,127.0.0.1,$localIP,*"
$env:CORS_ALLOW_ALL_ORIGINS = "True"
$env:DEBUG = "True"
$env:CSRF_TRUSTED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://$localIP:3000,http://$localIP:8000"

Write-Host "Configuration Django:" -ForegroundColor Yellow
Write-Host "  ALLOWED_HOSTS: $env:ALLOWED_HOSTS" -ForegroundColor White
Write-Host "  CORS_ALLOW_ALL_ORIGINS: $env:CORS_ALLOW_ALL_ORIGINS" -ForegroundColor White
Write-Host ""

# Vérifier l'environnement virtuel Python
if (Test-Path "backend\venv\Scripts\Activate.ps1") {
    Write-Host "Environnement virtuel Python trouve" -ForegroundColor Green
} else {
    Write-Host "ATTENTION: Environnement virtuel non trouve dans backend\venv\" -ForegroundColor Yellow
    Write-Host "Assurez-vous d'avoir cree l'environnement virtuel" -ForegroundColor Yellow
}

Write-Host ""

# Démarrer le backend Django
Write-Host "Demarrage du backend Django sur 0.0.0.0:8000..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:ALLOWED_HOSTS='localhost,127.0.0.1,$localIP,*'; `$env:CORS_ALLOW_ALL_ORIGINS='True'; `$env:DEBUG='True'; `$env:CSRF_TRUSTED_ORIGINS='http://localhost:3000,http://127.0.0.1:3000,http://$localIP:3000,http://$localIP:8000'; .\venv\Scripts\Activate.ps1; python manage.py runserver 0.0.0.0:8000" -PassThru

# Attendre que Django démarre
Start-Sleep -Seconds 4

# Créer un fichier .env.local dans le frontend avec l'IP locale
$envContent = "VITE_API_URL=http://$localIP:8000/api`n"
$envFile = "frontend\.env.local"
$envContent | Out-File -FilePath $envFile -Encoding utf8 -Force
Write-Host "Fichier .env.local cree dans frontend avec IP: $localIP" -ForegroundColor Green

# Démarrer le frontend Vite
Write-Host "Demarrage du frontend Vite sur 0.0.0.0:3000..." -ForegroundColor Yellow
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev -- --host 0.0.0.0 --port 3000" -PassThru

# Attendre que Vite démarre
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=== SERVEURS DEMARRES ===" -ForegroundColor Green
Write-Host ""
Write-Host "URLs d'acces:" -ForegroundColor Cyan
Write-Host "  Local (PC):    http://localhost:3000" -ForegroundColor White
Write-Host "  Reseau (Mobile): http://$localIP:3000" -ForegroundColor White
Write-Host ""
Write-Host "Backend API:" -ForegroundColor Cyan
Write-Host "  Local:         http://localhost:8000" -ForegroundColor White
Write-Host "  Reseau:        http://$localIP:8000" -ForegroundColor White
Write-Host ""
Write-Host "=== INSTRUCTIONS POUR ACCES MOBILE ===" -ForegroundColor Magenta
Write-Host "1. Assurez-vous que votre telephone est sur le meme reseau WiFi" -ForegroundColor Yellow
Write-Host "2. Ouvrez un navigateur sur votre telephone" -ForegroundColor Yellow
Write-Host "3. Entrez l'adresse: http://$localIP:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: Si la camera ne fonctionne pas sur Safari (iOS)," -ForegroundColor Yellow
Write-Host "      utilisez Chrome ou Firefox sur mobile" -ForegroundColor Yellow
Write-Host ""
Write-Host "COMPTES DE TEST:" -ForegroundColor Magenta
Write-Host "  ADMIN:" -ForegroundColor Magenta
Write-Host "    Email: slovengama@gmail.com" -ForegroundColor White
Write-Host "    Mot de passe: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "  VIGILE:" -ForegroundColor Magenta
Write-Host "    Email: Stemk2151@gmail.com" -ForegroundColor White
Write-Host "    Mot de passe: Vigile123!" -ForegroundColor White
Write-Host ""
Write-Host "Pour arreter les serveurs: Fermez les fenetres PowerShell" -ForegroundColor Red
Write-Host ""

