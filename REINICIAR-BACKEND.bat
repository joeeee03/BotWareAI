@echo off
echo ========================================
echo  REINICIAR BACKEND - SISTEMA COMPLETO
echo ========================================
echo.

echo [1/2] Cerrando procesos en puerto 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Cerrando proceso %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo [2/2] Iniciando backend...
cd backend
start "Backend Server - Sistema Robusto" cmd /k "npm run dev"

echo.
echo ========================================
echo  BACKEND REINICIADO
echo ========================================
echo.
echo El servidor deberia estar iniciando en una nueva ventana
echo.
echo Endpoints disponibles:
echo   - API: http://localhost:3001
echo   - Health: http://localhost:3001/api/health/detailed
echo.
pause
