# 🚂 Guía de Deployment en Railway

Esta guía te ayudará a desplegar tu aplicación de chat completa (Backend + Frontend) en Railway desde GitHub.

## 📋 Arquitectura del Deployment

Este proyecto está configurado para ejecutar **backend y frontend en un solo contenedor Docker**:
- ✅ **Backend (Express + Socket.IO)**: Puerto interno 3001
- ✅ **Frontend (Next.js)**: Puerto público (asignado por Railway, típicamente 3000)
- ✅ **Next.js hace proxy** de las peticiones API hacia el backend interno
- ✅ El URL público de Railway te da acceso directo al frontend

## 🎯 Requisitos Previos

1. **Cuenta de Railway**: [railway.app](https://railway.app)
2. **Repositorio en GitHub** con tu código
3. **Base de datos PostgreSQL** (puedes crearla en Railway)

## 🚀 Pasos para el Deployment

### 1. Crear un Nuevo Proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway para acceder a tu repositorio
5. Selecciona el repositorio de tu proyecto

### 2. Agregar PostgreSQL

1. En tu proyecto de Railway, click en "+ New"
2. Selecciona "Database" → "Add PostgreSQL"
3. Railway creará automáticamente la base de datos
4. Copia la variable `DATABASE_URL` (se generará automáticamente)

### 3. Configurar Variables de Entorno

En tu servicio de Railway, ve a "Variables" y agrega las siguientes:

#### Variables Requeridas:

```bash
# Base de datos (se genera automáticamente al agregar PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secret (genera uno seguro)
JWT_SECRET=tu-jwt-secret-muy-seguro-aqui

# Encryption Key - CRÍTICO: Usa la MISMA clave que en tu .env local
# Esta clave encripta/desencripta mensajes de chat y datos sensibles
# IMPORTANTE: Si usas otra clave, NO podrás desencriptar mensajes antiguos
ENCRYPTION_KEY=d9G4kPq7V2sH6nZ1xR8bT3wL0yF5cM2a

# Node Environment
NODE_ENV=production
```

⚠️ **MUY IMPORTANTE sobre ENCRYPTION_KEY:**
- Debes usar la **MISMA clave** que usas en tu entorno local
- Esta clave se usa para encriptar/desencriptar TODOS los mensajes de chat
- Los datos sensibles de bots también se encriptan con esta clave
- Si cambias esta clave, perderás acceso a todos los datos encriptados anteriormente

#### Variables Opcionales (Meta/WhatsApp API):

```bash
# WhatsApp Business API (si usas integración con WhatsApp)
META_API_TOKEN=tu_token_de_meta
META_BUSINESS_ACCOUNT_ID=tu_business_account_id
META_PHONE_NUMBER_ID=tu_phone_number_id
```

#### Variables para Desarrollo (NO necesarias en Railway):

```bash
# Estas NO son necesarias en Railway, el sistema las configura automáticamente
# PORT - Railway lo asigna automáticamente
# FRONTEND_URL - Se configura internamente
# NEXT_PUBLIC_BACKEND_URL - Se configura internamente
```

### 4. Deploy Automático

Railway detectará automáticamente tu `Dockerfile` y:
1. ✅ Compilará el backend (TypeScript → JavaScript)
2. ✅ Compilará el frontend (Next.js con modo standalone)
3. ✅ Iniciará ambos servicios usando `server-combined.js`
4. ✅ Expondrá el frontend en el URL público

### 5. Verificar el Deployment

1. Una vez completado el build, Railway te dará un URL público tipo:
   ```
   https://tu-proyecto.up.railway.app
   ```

2. Accede a ese URL y deberías ver tu frontend funcionando

3. Verifica que las APIs funcionan:
   ```
   https://tu-proyecto.up.railway.app/api/auth/...
   ```

## 🔧 Configuración del Proyecto

### Archivos Clave del Deployment:

#### 1. `Dockerfile`
- Build en dos etapas (builder + production)
- Compila backend TypeScript
- Compila frontend Next.js con output standalone
- Copia archivos necesarios para producción

#### 2. `server-combined.js`
- Inicia el backend en puerto 3001 (interno)
- Inicia el frontend en el puerto asignado por Railway
- Maneja shutdown graceful de ambos servicios

#### 3. `next.config.mjs`
- Configurado con `output: 'standalone'` para optimización
- Rewrites automáticos de `/api/*` al backend interno
- Rewrites de `/socket.io/*` para WebSocket

#### 4. `railway.json` / `railway.toml`
- Configuración de build con Dockerfile
- Health checks en la raíz `/`
- Políticas de reinicio automático

## 📊 Logs y Monitoreo

### Ver logs en Railway:
1. Ve a tu proyecto en Railway
2. Click en tu servicio
3. Ve a la pestaña "Deployments"
4. Click en el deployment activo
5. Verás logs en tiempo real:
   ```
   [Combined Server] 🚀 Starting backend and frontend...
   [Combined Server] 📡 Starting backend...
   [v0] Server running on port 3001
   [Combined Server] 🌐 Starting frontend...
   [Combined Server] ✅ Both services started successfully!
   ```

## 🐛 Troubleshooting

### Error: "Application failed to respond"
- **Causa**: El health check está fallando
- **Solución**: Verifica los logs, asegúrate de que ambos servicios inicien correctamente

### Error: "Build failed"
- **Causa**: Falta alguna dependencia o error en el código
- **Solución**: Revisa los logs de build, asegúrate de que `npm run build` funcione localmente

### Error de conexión a la base de datos
- **Causa**: `DATABASE_URL` no está configurada correctamente
- **Solución**: 
  1. Verifica que agregaste PostgreSQL a tu proyecto
  2. Verifica que la variable `DATABASE_URL` existe
  3. Ejecuta las migraciones de base de datos

### WebSocket no conecta
- **Causa**: Next.js no está haciendo proxy correctamente
- **Solución**: Verifica que `next.config.mjs` tenga los rewrites para `/socket.io/*`

## 🔄 Re-deploys y Actualizaciones

Railway hace **auto-deploy** cada vez que haces push a tu rama principal:

1. Haz cambios en tu código local
2. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Mi actualización"
   git push origin main
   ```
3. Railway detectará el push automáticamente
4. Iniciará un nuevo build
5. Si el build es exitoso, reemplazará el deployment anterior

## 🔐 Seguridad

### Variables Sensibles:
- ✅ Nunca hagas commit de `.env` o `.env.local`
- ✅ Usa variables de entorno en Railway para datos sensibles
- ✅ Genera un `JWT_SECRET` fuerte (mínimo 32 caracteres aleatorios)
- ⚠️ **CRÍTICO**: Usa la **MISMA** `ENCRYPTION_KEY` en local y Railway

### Generar JWT Secret Seguro:
```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ⚠️ ENCRYPTION_KEY - MUY IMPORTANTE:
Esta clave encripta/desencripta **TODOS** los mensajes de chat y datos sensibles.

**Reglas:**
1. Usa la **MISMA clave** que tienes en tu `.env` local
2. **NUNCA** cambies esta clave (perderás acceso a mensajes antiguos)
3. Guárdala en un lugar seguro (password manager)
4. Si la pierdes, NO podrás recuperar los datos encriptados

Ver `ENCRYPTION_WARNING.md` para más detalles.

## 📚 Recursos Adicionales

- [Railway Docs](https://docs.railway.app/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

## ✅ Checklist Final

Antes de hacer el deployment, verifica:

- [ ] Repository en GitHub está actualizado
- [ ] PostgreSQL agregada en Railway
- [ ] Variable `DATABASE_URL` configurada
- [ ] Variable `JWT_SECRET` configurada
- [ ] Variable `ENCRYPTION_KEY` configurada (⚠️ MISMA que local)
- [ ] Variable `NODE_ENV=production` configurada
- [ ] Archivo `Dockerfile` presente en el root
- [ ] Archivo `server-combined.js` presente en el root
- [ ] `next.config.mjs` tiene `output: 'standalone'`
- [ ] Leíste `ENCRYPTION_WARNING.md` para entender la clave de encriptación

¡Listo! Tu aplicación debería estar funcionando en Railway con frontend y backend completamente operativos. 🎉
