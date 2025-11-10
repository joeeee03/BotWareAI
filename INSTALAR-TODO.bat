@echo off
echo ========================================
echo  INSTALACION COMPLETA DEL PROYECTO
echo ========================================
echo.
echo Este script instalara todas las dependencias
echo necesarias para el proyecto completo.
echo.
echo Pasos:
echo 1. Instalar dependencias del frontend (root)
echo 2. Instalar dependencias del backend
echo 3. Verificar instalacion
echo.
pause
echo.

echo ========================================
echo [1/3] Instalando dependencias del frontend...
echo ========================================
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al instalar dependencias del frontend
    pause
    exit /b 1
)

echo.
echo ✅ Dependencias del frontend instaladas
echo.

echo ========================================
echo [2/3] Instalando dependencias del backend...
echo ========================================
echo.

cd backend
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al instalar dependencias del backend
    cd ..
    pause
    exit /b 1
)

echo.
echo ✅ Dependencias del backend instaladas
echo.
cd ..

echo ========================================
echo [3/3] Verificando instalacion...
echo ========================================
echo.

echo Verificando modulos criticos...
echo.

echo Frontend:
if exist node_modules\next (
    echo   ✅ Next.js
) else (
    echo   ❌ Next.js - FALTA
)

if exist node_modules\socket.io-client (
    echo   ✅ Socket.IO Client
) else (
    echo   ❌ Socket.IO Client - FALTA
)

if exist node_modules\axios (
    echo   ✅ Axios
) else (
    echo   ❌ Axios - FALTA
)

echo.
echo Backend:
if exist backend\node_modules\express (
    echo   ✅ Express
) else (
    echo   ❌ Express - FALTA
)

if exist backend\node_modules\socket.io (
    echo   ✅ Socket.IO Server
) else (
    echo   ❌ Socket.IO Server - FALTA
)

if exist backend\node_modules\pg (
    echo   ✅ PostgreSQL Client
) else (
    echo   ❌ PostgreSQL Client - FALTA
)

if exist backend\node_modules\tsx (
    echo   ✅ TSX
) else (
    echo   ❌ TSX - FALTA
)

echo.
echo ========================================
echo  INSTALACION COMPLETADA
echo ========================================
echo.
echo Siguiente paso:
echo 1. Configura el archivo .env.local (si no lo hiciste)
echo 2. Ejecuta: INICIAR.bat
echo.
pause
