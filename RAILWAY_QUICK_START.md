# 🚀 Guía Rápida - Deploy en Railway (5 minutos)

## ✅ Ya está listo en tu repositorio:
- ✓ `Dockerfile` - Containerización
- ✓ `railway.json` y `railway.toml` - Configuración Railway
- ✓ `DEPLOYMENT.md` - Guía completa
- ✓ `.env.example` - Variables necesarias
- ✓ Todo pusheado a GitHub

## 📋 Pasos para hacer el Deploy

### Paso 1: Acceder a Railway
1. Ve a [https://railway.app](https://railway.app)
2. Haz login con tu cuenta (o crea una si no tienes)

### Paso 2: Crear nuevo proyecto
1. Haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Autoriza Railway con tu GitHub
4. Selecciona el repositorio **`chatmessages-bot`**
5. Selecciona la rama **`main`**

### Paso 3: Agregar base de datos
1. En el Dashboard del proyecto, haz clic en **"+ New"**
2. Selecciona **"PostgreSQL"**
3. Railway crea la BD y agrega automáticamente `DATABASE_URL`

### Paso 4: Configurar variables de entorno
En el servicio del backend (donde dice "Deploy"), ve a la pestaña **"Variables"** y agrega:

```
DATABASE_URL = [Viene automáticamente de PostgreSQL]
PORT = 3001
NODE_ENV = production
FRONTEND_URL = https://tu-frontend-url.railway.app
JWT_SECRET = tu-clave-secreta-super-larga-aqui
META_API_TOKEN = tu-token-meta
META_BUSINESS_ACCOUNT_ID = tu-account-id
META_PHONE_NUMBER_ID = tu-phone-id
ENCRYPTION_KEY = tu-clave-encriptacion-opcional
```

### Paso 5: Deploy
1. Railway automáticamente comienza a buildear cuando cambias variables
2. Puedes ver los logs en tiempo real
3. Espera hasta ver ✅ (deployment completado)
4. Haz clic en "View Deployment" para obtener tu URL

### Paso 6: Verificar
- Accede a `https://tu-dominio-railway.app/health`
- Deberías ver: `{"status":"ok","timestamp":"..."}` ✅

## 🔗 URLs generadas por Railway

- **Backend**: `https://chatmessages-bot.railway.app`
- **Base de datos**: Accesible solo internamente (seguro)

## ⚙️ Si el build falla

Revisa los logs. Las causas comunes son:

1. **Variables de entorno faltantes**
   - Solución: Agrega todas las variables de `.env.example`

2. **Base de datos no conecta**
   - Solución: Verifica que PostgreSQL está en "up"
   - Copia el `DATABASE_URL` correcto

3. **Errores de compilación**
   - Solución: Revisa que el Dockerfile es correcto
   - Intenta `npm run build:backend` localmente

## 📝 Archivos importantes

- `Dockerfile` - Define cómo se construye y ejecuta el contenedor
- `railway.json` - Configuración específica de Railway
- `.env.example` - Template de variables necesarias
- `DEPLOYMENT.md` - Guía completa detallada

## 🎯 Próximos pasos después del deploy

1. Apunta tu dominio personalizado (si tienes uno)
2. Configura SSL/TLS (Railway lo hace automáticamente)
3. Agrega webhooks de WhatsApp si lo necesitas
4. Monitorea logs y métricas en Railway Dashboard

## 📞 Soporte

- Documentación Railway: https://docs.railway.app
- Mi repositorio: https://github.com/iiDrex/chatmessages-bot

---

**¡Todo está listo! Solo necesitas:**
1. Ir a Railway
2. Conectar GitHub
3. Configurar variables
4. ¡Listo! 🎉
