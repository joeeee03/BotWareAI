@echo off
:: QUICK PUSH - Version ultra rapida sin confirmaciones
cd /d "%~dp0"

:: Verificar git
if not exist ".git" (
    echo ERROR: No es un repositorio git
    exit /b 1
)

:: Agregar todo y hacer push rapido
git add . >nul 2>&1

:: Generar timestamp para commit
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set fecha=%%a/%%b/%%c
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set hora=%%a:%%b
set timestamp=%fecha% %hora%

:: Commit y push en una linea
git commit -m "Quick update: %timestamp%" >nul 2>&1 && git push >nul 2>&1

if errorlevel 1 (
    echo ❌ Error en push
) else (
    echo ✅ Push exitoso: %timestamp%
)

timeout /t 2 >nul
