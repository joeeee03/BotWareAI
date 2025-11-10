@echo off
echo ============================================
echo    INICIANDO SISTEMA DE MENSAJERIA
echo ============================================
echo.

echo 1. Iniciando BACKEND en puerto 3001...
echo.
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak >nul

echo 2. Iniciando FRONTEND en puerto 3000...
echo.
start "Frontend Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo    SERVIDORES INICIADOS
echo ============================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Login: quiroga.joeee@gmail.com
echo Password: Jq@30Mar07!
echo.
echo Abre DevTools (F12) para ver logs
echo.
pause
