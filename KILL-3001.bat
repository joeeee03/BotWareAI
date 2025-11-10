@echo off
echo Cerrando proceso en puerto 3001...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo ✅ Proceso cerrado (PID: %%a)
)

echo Listo!
