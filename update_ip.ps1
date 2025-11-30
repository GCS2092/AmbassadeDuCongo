# Script de mise a jour automatique de l'adresse IP
Write-Host "Mise a jour de l'adresse IP..." -ForegroundColor Cyan

# Obtenir l'adresse IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -like '192.168.*' }).IPAddress | Select-Object -First 1

if (-not $ip) {
    Write-Host "Entrez votre IP:" -ForegroundColor Yellow
    $ip = Read-Host
}

Write-Host "IP detectee: $ip" -ForegroundColor Green

# Mettre a jour api.ts
$apiFile = "frontend\src\lib\api.ts"
if (Test-Path $apiFile) {
    $content = Get-Content $apiFile -Raw
    $content = $content -replace "http://192\.168\.\d+\.\d+:8000", "http://$ip:8000"
    Set-Content $apiFile -Value $content
    Write-Host "Mis a jour: $apiFile" -ForegroundColor Green
}

# Mettre a jour start_simple.ps1
$startFile = "start_simple.ps1"
if (Test-Path $startFile) {
    $content = Get-Content $startFile -Raw
    $content = $content -replace "192\.168\.\d+\.\d+:8000", "$ip:8000"
    $content = $content -replace "192\.168\.\d+\.\d+:3000", "$ip:3000"
    Set-Content $startFile -Value $content
    Write-Host "Mis a jour: $startFile" -ForegroundColor Green
}

Write-Host "Termine!" -ForegroundColor Green
Write-Host "URLs: http://$ip:3000 et http://$ip:8000" -ForegroundColor Cyan
