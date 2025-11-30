@echo off
echo ========================================
echo   AMBASSADE DU CONGO - DEMARRAGE
echo ========================================

echo.
echo [1/4] Activation de l'environnement virtuel...
call backend\venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERREUR: Impossible d'activer l'environnement virtuel
    echo Veuillez installer Python et créer l'environnement virtuel
    pause
    exit /b 1
)

echo.
echo [2/4] Configuration des utilisateurs admin et vigile...
cd backend
python manage.py setup_admin_vigile
cd ..

echo.
echo [3/4] Démarrage du serveur Django (Backend)...
cd backend
start "Django Backend" cmd /k "python manage.py runserver 0.0.0.0:8000"
cd ..

echo.
echo [4/4] Démarrage du serveur React (Frontend)...
cd frontend
start "React Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo   SERVEURS DÉMARRÉS AVEC SUCCÈS!
echo ========================================
echo.
echo 🌐 Frontend (React): http://localhost:3001
echo 🔧 Backend (Django): http://localhost:8000
echo.
echo 👤 ADMIN:
echo    Email: slovengama@gmail.com
echo    Mot de passe: Admin123!
echo.
echo 🛡️ VIGILE:
echo    Email: Stemk2151@gmail.com
echo    Mot de passe: Vigile123!
echo.
echo 📱 Scanner QR: http://localhost:3001/security/scanner
echo 🔐 Admin Panel: http://localhost:3001/admin
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause > nul
