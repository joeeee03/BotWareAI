# 🎯 Railway - Comandos y Referencias Rápidas

## 📋 Comandos Copy-Paste

### 1. Generar JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Preparar para Deploy

```bash
# Ver status
git status

# Agregar todos los cambios
git add .

# Commit
git commit -m "Configurado para Railway deployment"

# Push a GitHub
git push origin main
```

### 3. Variables de Entorno para Railway

Copia estas variables en Railway → Variables:

```bash
JWT_SECRET=pega-aqui-el-secret-generado
ENCRYPTION_KEY=d9G4kPq7V2sH6nZ1xR8bT3wL0yF5cM2a
NODE_ENV=production
```

⚠️ **Usa la MISMA ENCRYPTION_KEY que en tu .env local**

### 4. (Opcional) Railway CLI

#### Instalar:
```bash
npm install -g @railway/cli
```

#### Login:
```bash
railway login
```

#### Ver logs:
```bash
railway logs
```

#### Ver variables:
```bash
railway variables
```

#### Ejecutar comandos en Railway:
```bash
railway run <command>
```

## 🔗 URLs Importantes

- **Railway Dashboard**: https://railway.app
- **Railway Docs**: https://docs.railway.app/
- **Next.js Docs**: https://nextjs.org/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## 📊 Verificar Deployment

### Check 1: Ver Logs de Build
```
Railway → Tu Proyecto → Deployments → Click en el deployment activo
```

### Check 2: Ver Logs de Runtime
Busca estos mensajes de éxito:
```
[Combined Server] 🚀 Starting backend and frontend...
[Combined Server] 📡 Starting backend...
[v0] ✅ Server running on port 3001
[Combined Server] 🌐 Starting frontend...
[Combined Server] ✅ Both services started successfully!
```

### Check 3: Probar Endpoints

#### Frontend:
```
https://tu-proyecto.up.railway.app/
```

#### API Health:
```
https://tu-proyecto.up.railway.app/api/health
```

#### WebSocket (desde consola del browser):
```javascript
const socket = io('https://tu-proyecto.up.railway.app', {
  auth: { token: 'tu-jwt-token' }
});
console.log(socket.connected);
```

## 🐛 Debug Commands

### Ver logs en vivo:
```bash
railway logs -f
```

### Ver variables configuradas:
```bash
railway variables
```

### SSH al contenedor (si es necesario):
```bash
railway shell
```

### Forzar redeploy:
```bash
# Desde la web: Settings → Redeploy

# O hacer un commit vacío:
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

## 🔄 Workflow de Desarrollo

### Desarrollo Local:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev
```

### Deploy a Railway:
```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
# Railway auto-deploys automáticamente
```

## 📦 Si necesitas reinstalar dependencias

### Localmente:
```bash
# Root
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### En Railway:
Railway reconstruirá automáticamente en el próximo deploy.

## 🔐 Generar más Secrets

### JWT Secret (32 bytes):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### JWT Secret (64 bytes):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Random UUID:
```bash
node -e "console.log(require('crypto').randomUUID())"
```

### Random String (base64):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📈 Monitoreo

### Ver métricas en Railway:
1. Ve a tu proyecto
2. Click en "Metrics"
3. Verás CPU, Memoria, Network

### Ver logs con filtros:
```bash
# Ver solo errores
railway logs | grep "error"

# Ver logs del backend
railway logs | grep "\[v0\]"

# Ver logs del frontend
railway logs | grep "\[Combined Server\]"
```

## 🎯 Checklist de Verificación

### Antes del primer deploy:
- [ ] `git push origin main` exitoso
- [ ] JWT_SECRET generado
- [ ] Cuenta en Railway creada

### Durante el deploy:
- [ ] Proyecto creado en Railway
- [ ] PostgreSQL agregada
- [ ] Variables configuradas
- [ ] Build completado sin errores

### Después del deploy:
- [ ] URL público funciona
- [ ] Frontend carga correctamente
- [ ] Login/Registro funciona
- [ ] Mensajes se envían
- [ ] WebSocket conecta
- [ ] No hay errores en logs

## 💡 Tips

1. **Logs en tiempo real**: Mantén abierta la pestaña de Deployments para ver logs
2. **Auto-deploy**: Cada push a `main` hace deploy automático
3. **Rollback**: Puedes hacer rollback a deployments anteriores desde la UI
4. **Variables**: Cambiar variables reinicia el servicio automáticamente
5. **Health checks**: Si falla el health check, Railway reiniciará el contenedor

## 🆘 Soporte

- Railway Discord: https://discord.gg/railway
- Railway Status: https://railway.statuspage.io/
- Docs: https://docs.railway.app/

---

## 📚 Archivos de Referencia

- **Guía Rápida**: `RAILWAY_QUICKSTART.md`
- **Guía Completa**: `RAILWAY_DEPLOYMENT.md`
- **Variables**: `.env.railway.example`
- **Resumen**: `DEPLOYMENT_READY.md`
- **Setup Visual**: `RAILWAY_SETUP.txt`
