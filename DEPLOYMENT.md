# Deployment Guide - Railway

Este documento proporciona instrucciones paso a paso para deployar el proyecto en Railway.

## Requisitos previos

1. Cuenta en [Railway](https://railway.app)
2. Cuenta en [GitHub](https://github.com)
3. Repositorio GitHub con los cambios pusheados

## Pasos para Deployar

### 1. Preparar el Repositorio

✅ **Ya completado en este proyecto:**
- Dockerfile configurado
- railway.json configurado
- .env.example con todas las variables
- Scripts de build actualizados

### 2. Crear Proyecto en Railway

1. Accede a [railway.app](https://railway.app)
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza GitHub y selecciona el repositorio `chatmessages-bot`

### 3. Configurar Variables de Entorno

En la sección de **Variables** del proyecto en Railway, agrega:

```env
# Servidor
PORT=3001
NODE_ENV=production

# Base de datos (Railway proporciona DATABASE_URL automáticamente si agregaste PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Frontend URL (tu dominio en Railway)
FRONTEND_URL=https://tu-frontend-dominio.railway.app

# JWT
JWT_SECRET=tu-clave-jwt-super-secreta-aqui

# WhatsApp/Meta API
META_API_TOKEN=tu_token_meta
META_BUSINESS_ACCOUNT_ID=tu_account_id
META_PHONE_NUMBER_ID=tu_phone_id

# Encriptación (opcional)
ENCRYPTION_KEY=tu-clave-encriptacion-aes-256
```

### 4. Agregar Base de Datos PostgreSQL

1. En Railway Dashboard, haz clic en "+ New"
2. Selecciona "PostgreSQL"
3. Railway agregará automáticamente `DATABASE_URL` a tus variables

### 5. Configurar el Dominio

1. En la sección de "Deployment" en Railway
2. Haz clic en "Generate Domain" o personaliza el dominio
3. Copia la URL del dominio

### 6. Deploy

El deploy se inicia automáticamente cuando:
- Haces push a la rama `main` en GitHub
- Actualizas variables de entorno
- Manualmente desde el dashboard de Railway

### 7. Verificar el Deploy

1. Espera a que Railway termine de buildear (verás los logs en tiempo real)
2. Una vez completado, deberías ver ✅ en el deployment
3. Accede a `https://tu-dominio.railway.app/health` para verificar que el servidor está activo

## Solución de Problemas

### El build falla
- Revisa los logs en Railway Dashboard
- Asegúrate de que todas las variables de entorno estén configuradas
- Verifica que el `package.json` tenga todos los scripts necesarios

### Base de datos no conecta
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que la base de datos PostgreSQL está en "up"
- Ejecuta migraciones si es necesario

### Socket.IO no funciona
- Verifica que `FRONTEND_URL` sea la URL correcta del frontend
- Asegúrate de que CORS esté configurado correctamente en `server.ts`
- Verifica que el servidor está escuchando en el puerto correcto (3001)

## Scripts disponibles

```bash
npm start              # Inicia el servidor de producción
npm run build:backend  # Compila TypeScript del backend
npm run seed          # Ejecuta seeds en la base de datos
npm run reset-db      # Resetea la base de datos
```

## Estructura del Dockerfile

El Dockerfile está optimizado para:
- ✅ Multi-stage builds (no aplicable aquí por simplificar)
- ✅ Minimal image size
- ✅ Health checks
- ✅ Proper signal handling

## Monitoreo en Railway

Después del deploy, puedes monitorear:

1. **Logs**: Railway muestra logs en tiempo real
2. **Métricas**: CPU, memoria, red
3. **Historial de deploys**: Rollback si es necesario
4. **Variables**: Actualiza sin re-deployar completamente

## Próximos pasos

1. Configura CI/CD adicional si lo necesitas
2. Agrega monitoreo y alertas
3. Configura backups automáticos de la base de datos
4. Implementa logging centralizado

## Contacto y Soporte

Para más información sobre Railway:
- [Documentación de Railway](https://docs.railway.app)
- [Comunidad de Railway](https://discord.gg/railway)
