# 🚀 Railway Quick Start - Deploy en 5 Minutos

## 📦 Paso 1: Preparar GitHub

```bash
# Asegúrate de que todo esté commiteado
git add .
git commit -m "Preparado para Railway deployment"
git push origin main
```

## 🚂 Paso 2: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Click **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Elige tu repositorio
5. Railway iniciará el build automáticamente

## 🗄️ Paso 3: Agregar Base de Datos

1. En tu proyecto, click **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. ✅ Railway creará `DATABASE_URL` automáticamente

## 🔐 Paso 4: Configurar Variables de Entorno

En tu servicio, ve a **"Variables"** y agrega:

### Variables REQUERIDAS:

```bash
JWT_SECRET=genera-uno-seguro-aqui
ENCRYPTION_KEY=d9G4kPq7V2sH6nZ1xR8bT3wL0yF5cM2a
NODE_ENV=production
```

⚠️ **IMPORTANTE sobre ENCRYPTION_KEY:**
- Usa la **MISMA clave** que usas localmente (la que está en tu `.env`)
- Esta clave encripta/desencripta mensajes de chat
- Si usas otra clave, NO podrás leer los mensajes antiguos

### Generar JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ✅ Paso 5: Esperar el Deploy

Railway:
- ✅ Construirá el Dockerfile
- ✅ Compilará backend y frontend
- ✅ Te dará un URL público tipo: `https://tu-proyecto.up.railway.app`

## 🌐 Paso 6: Acceder a tu App

Abre el URL que Railway te dio. ¡Deberías ver tu frontend funcionando!

---

## 🎯 ¿Qué hace el sistema automáticamente?

- ✅ **Backend** corre internamente en puerto 3001
- ✅ **Frontend** corre en el puerto público (asignado por Railway)
- ✅ Next.js hace **proxy automático** de `/api/*` al backend
- ✅ WebSocket (`/socket.io`) también funciona automáticamente
- ✅ **Un solo URL** te da acceso a todo

## 🔄 Updates Automáticos

Cada vez que hagas push a GitHub:
```bash
git push origin main
```
Railway hará **auto-deploy** automáticamente.

## 🐛 Si algo falla

1. Ve a **"Deployments"** en Railway
2. Click en el deployment activo
3. Revisa los **logs**
4. Busca mensajes de error

### Errores Comunes:

- **"Application failed to respond"**: Revisa que `DATABASE_URL`, `JWT_SECRET` y `ENCRYPTION_KEY` estén configurados
- **Build failed**: Asegúrate que el código compile localmente
- **Database connection error**: Verifica que agregaste PostgreSQL al proyecto
- **Mensajes no se leen**: Verifica que `ENCRYPTION_KEY` sea la misma que usas localmente

## 📚 Más Info

Ver `RAILWAY_DEPLOYMENT.md` para la guía completa.

---

## ✅ Checklist Express

- [ ] Repository en GitHub actualizado
- [ ] Proyecto creado en Railway desde GitHub
- [ ] PostgreSQL agregada
- [ ] `JWT_SECRET` configurado en Variables
- [ ] `ENCRYPTION_KEY` configurado (misma clave que local)
- [ ] `NODE_ENV=production` configurado
- [ ] Build completado exitosamente
- [ ] URL público accesible

¡Eso es todo! 🎉
