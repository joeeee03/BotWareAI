@echo off
echo ========================================
echo  LIMPIAR ARCHIVOS INNECESARIOS
echo ========================================
echo.
echo Este script eliminara archivos de documentacion
echo y pruebas que ya no son necesarios.
echo.
echo Se mantendran solo los archivos esenciales
echo para el funcionamiento del bot.
echo.
echo ⚠️  ADVERTENCIA: Esta accion no se puede deshacer
echo.
pause
echo.

echo Eliminando archivos de documentacion...

REM Documentacion innecesaria
del /F /Q "COMO-ENVIAR-MENSAJES.md" 2>nul
del /F /Q "COMO-PROBAR.md" 2>nul
del /F /Q "DIAGNOSTICO.md" 2>nul
del /F /Q "ENCRYPTION-GUIDE.md" 2>nul
del /F /Q "FIX-COMPLETO-SISTEMA.md" 2>nul
del /F /Q "FIX-DUPLICADOS-FINAL.md" 2>nul
del /F /Q "FIX-MENSAJES-DUPLICADOS.md" 2>nul
del /F /Q "HAZ-ESTO-AHORA.md" 2>nul
del /F /Q "INICIO-RAPIDO.md" 2>nul
del /F /Q "INSTALACION-COMPLETA.md" 2>nul
del /F /Q "LEEME-URGENTE.md" 2>nul
del /F /Q "OPTIMIZACION-CARGA-RAPIDA.md" 2>nul
del /F /Q "REINICIAR-AHORA.md" 2>nul
del /F /Q "RESUMEN-FINAL-MEJORAS.md" 2>nul
del /F /Q "SCROLL-ARREGLADO-TIMING.md" 2>nul
del /F /Q "SCROLL-AUTOMATICO-MEJORADO.md" 2>nul
del /F /Q "SCROLL-INSTANTANEO.md" 2>nul
del /F /Q "SCROLL-SHADCN-FIX.md" 2>nul
del /F /Q "SETUP.md" 2>nul
del /F /Q "SOLUCION-ERROR-META-API.md" 2>nul
del /F /Q "SOLUCION-MENSAJES-ENCRIPTADOS.md" 2>nul
del /F /Q "TEST-FINAL.md" 2>nul
del /F /Q "TIEMPO-REAL-COMPLETO.md" 2>nul
del /F /Q "test-auth-flow.md" 2>nul

echo ✅ Archivos de documentacion eliminados

echo.
echo Eliminando scripts de prueba innecesarios...

REM Scripts .bat de prueba
del /F /Q "CERRAR-PUERTO-3001.bat" 2>nul
del /F /Q "PROBAR-AHORA.bat" 2>nul
del /F /Q "PROBAR-CON-LOGS.bat" 2>nul
del /F /Q "PROBAR-ENVIO-MENSAJE.bat" 2>nul
del /F /Q "PROBAR-META-API-DIRECTO.bat" 2>nul
del /F /Q "PRUEBA-TIEMPO-REAL.bat" 2>nul
del /F /Q "REINICIAR-AHORA.md" 2>nul
del /F /Q "REINICIAR-BACKEND-FINAL.bat" 2>nul
del /F /Q "REINICIAR-Y-PROBAR.bat" 2>nul
del /F /Q "SOLUCION-FINAL.bat" 2>nul
del /F /Q "TEST-RAPIDO.bat" 2>nul
del /F /Q "INSTALAR-TIEMPO-REAL.bat" 2>nul

echo ✅ Scripts de prueba eliminados

echo.
echo Eliminando scripts de prueba en /scripts...

REM Scripts de prueba
del /F /Q "scripts\test-encryption.js" 2>nul
del /F /Q "scripts\test-envio-mensaje.js" 2>nul
del /F /Q "scripts\test-meta-api-directo.js" 2>nul
del /F /Q "scripts\simple-encryption-test.js" 2>nul
del /F /Q "scripts\login.json" 2>nul
del /F /Q "scripts\fix-password-hash.js" 2>nul
del /F /Q "scripts\limpiar-numero-telefono.sql" 2>nul
del /F /Q "scripts\verificar-numero-conversacion.sql" 2>nul

echo ✅ Scripts de prueba en /scripts eliminados

echo.
echo ========================================
echo  LIMPIEZA COMPLETADA
echo ========================================
echo.
echo Archivos mantenidos:
echo   ✅ INICIAR.bat - Script principal
echo   ✅ REINICIAR-BACKEND.bat - Reiniciar backend
echo   ✅ KILL-3001.bat - Cerrar puerto 3001
echo   ✅ INSTALAR-TODO.bat - Instalacion completa
echo   ✅ README.md - Documentacion principal
echo   ✅ Codigo fuente (app, backend, components, etc.)
echo   ✅ Scripts SQL necesarios (triggers, DB)
echo   ✅ Scripts de gestion de usuarios/passwords
echo.
echo Archivos eliminados:
echo   ❌ Documentacion excesiva (25+ archivos .md)
echo   ❌ Scripts de prueba (.bat y .js)
echo   ❌ Archivos temporales de testing
echo.
pause
