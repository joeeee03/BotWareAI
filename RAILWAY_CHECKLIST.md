# 🚀 Railway Deployment Checklist

## ✅ Fase 1: Preparación (COMPLETADA)

- [x] **Backend configurado** - Express + Socket.IO + PostgreSQL
- [x] **Dockerfile creado** - Containerización lista
- [x] **Scripts de build** - npm run build:backend configurado
- [x] **Variables de entorno** - .env.example completo
- [x] **Documentación** - DEPLOYMENT.md y QUICK_START.md
- [x] **GitHub sincronizado** - Todo pusheado a main

## 📋 Fase 2: Setup en Railway (PRÓXIMO PASO)

### Paso 1: Crear Cuenta (si no la tienes)
- [ ] Ve a https://railway.app
- [ ] Crea cuenta o haz login
- [ ] Verifica email

### Paso 2: Conectar GitHub
- [ ] En Railway Dashboard: Click "New Project"
- [ ] Selecciona "Deploy from GitHub repo"
- [ ] Autoriza Railway con GitHub
- [ ] Selecciona usuario: `iiDrex`
- [ ] Selecciona repo: `chatmessages-bot`
- [ ] Rama: `main`
- [ ] Click "Deploy"

### Paso 3: Agregar PostgreSQL
- [ ] En el proyecto Railway: Click "+ New"
- [ ] Selecciona "PostgreSQL"
- [ ] Espera a que se cree la BD
- [ ] Verifica que `DATABASE_URL` aparece en variables

### Paso 4: Configurar Variables de Entorno
En el servicio del backend, vé a "Variables" y agrega:

```
DATABASE_URL = [Copia automáticamente de PostgreSQL]
PORT = 3001
NODE_ENV = production
```

Luego agrega tus variables personales:
```
FRONTEND_URL = [Tu URL de Railway]
JWT_SECRET = [Generá una clave segura]
META_API_TOKEN = [Tu token de Meta]
META_BUSINESS_ACCOUNT_ID = [Tu account ID]
META_PHONE_NUMBER_ID = [Tu phone ID]
ENCRYPTION_KEY = [Opcional, clave de encriptación]
```

- [ ] DATABASE_URL ✅
- [ ] PORT ✅
- [ ] NODE_ENV ✅
- [ ] FRONTEND_URL ✅
- [ ] JWT_SECRET ✅
- [ ] META_API_TOKEN ✅
- [ ] META_BUSINESS_ACCOUNT_ID ✅
- [ ] META_PHONE_NUMBER_ID ✅
- [ ] ENCRYPTION_KEY (opcional) ✅

### Paso 5: Deployar
- [ ] Railway comienza automáticamente a buildear
- [ ] Espera a ver ✅ en el deployment
- [ ] Los logs deberían mostrar "Server running on port 3001"

### Paso 6: Verificar Funcionamiento
- [ ] Click en el URL generado por Railway
- [ ] Ve a `/health`
- [ ] Deberías ver: `{"status":"ok","timestamp":"..."}`
- [ ] Nota: Por ahora solo tienes el backend, sin frontend

## 🔧 Fase 3: Monitoreo (POST-DEPLOY)

### Logs
- [ ] Revisa logs en tiempo real en Railway
- [ ] Busca errores de conexión a BD
- [ ] Busca errores de compilación TypeScript

### Performance
- [ ] Monitorea CPU usage
- [ ] Monitorea Memory usage
- [ ] Verifica que no hay crasheos

### Base de Datos
- [ ] Verifica conexión a PostgreSQL
- [ ] Corre migraciones si es necesario
- [ ] Verifica que se pueden insertar datos

## 🎯 Fase 4: Configuración Avanzada (OPCIONAL)

### Dominio Personalizado
- [ ] Ve a "Settings" en el proyecto
- [ ] Click "Custom Domain"
- [ ] Agrega tu dominio (ej: api.tudominio.com)
- [ ] Apunta DNS a Railway

### Webhooks de WhatsApp
- [ ] En settings de tu app WhatsApp/Meta
- [ ] Agrega webhook URL: `https://tu-railway-url/api/webhook`
- [ ] Token de verificación: agrégalo a variables si lo necesitas

### Backups de Base de Datos
- [ ] En PostgreSQL service → Backups
- [ ] Activa backups automáticos
- [ ] Configura frecuencia de backups

### Alertas y Monitoreo
- [ ] Railway → Settings → Notifications
- [ ] Configura alertas de deployment fallido
- [ ] Configura alertas de alta CPU/Memoria

## 📚 Recursos Útiles

### Documentación
- [ ] Leé RAILWAY_QUICK_START.md
- [ ] Leé DEPLOYMENT.md para más detalles
- [ ] Documentación oficial: https://docs.railway.app

### Solución de Problemas
- [ ] Si falla el build → Revisa "Solución de Problemas" en DEPLOYMENT.md
- [ ] Si no conecta a BD → Verifica DATABASE_URL
- [ ] Si Socket.IO no funciona → Verifica FRONTEND_URL

## 🎁 Comandos Útiles

### En tu PC (local)
```bash
# Probar que compila
npm run build:backend

# Ver si el server inicia
npm run dev:backend

# Resetear BD local
npm run reset-db
```

### En Railway CLI (si instalaś)
```bash
# Login
railway login

# Linkear proyecto
railway link

# Ver logs
railway logs

# Redeploy
railway redeploy
```

## ✨ Próximos Pasos Después del Deploy

1. **Conectar Frontend** - Agregar URL del frontend
2. **HTTPS** - Railway lo hace automáticamente
3. **Monitoreo** - Configura alertas
4. **CI/CD Avanzado** - Si necesitas más
5. **Scaling** - Upgradea recursos si es necesario

## 🆘 Soporte

- Railway Support: https://railway.app/support
- Discord Community: https://discord.gg/railway
- Tu repositorio: https://github.com/iiDrex/chatmessages-bot

---

## 📊 Estado de Deployment

| Fase | Estado | Completado |
|------|--------|-----------|
| Preparación | ✅ DONE | 100% |
| Railway Setup | ⏳ IN PROGRESS | 0% |
| Monitoreo | ⏸️ PENDING | 0% |
| Avanzado | ⏸️ PENDING | 0% |

**Siguiente paso**: Ir a https://railway.app y comenzar Fase 2

---

**Última revisión**: 2024
**Estado**: Listo para deployment
**Tiempo estimado para deploy**: 5-10 minutos
