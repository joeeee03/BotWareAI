# 💬 WhatsApp Business Chat Bot

Sistema de chat profesional integrado con WhatsApp Business API para gestionar conversaciones con clientes en tiempo real.

## ✨ Características

- 🔐 **Sistema de autenticación** con JWT
- 💬 **Chat en tiempo real** con Socket.IO
- 🔒 **Mensajes encriptados** en base de datos
- 📱 **Integración con WhatsApp Business API**
- 🚀 **Sistema robusto** con circuit breakers, rate limiting y message queue
- 🎨 **Interfaz moderna** con Next.js y Tailwind CSS
- 📊 **PostgreSQL** con notificaciones en tiempo real

## 🚀 Inicio Rápido

### 1. Clonar e Instalar

```bash
# Instalar todas las dependencias
.\INSTALAR-TODO.bat
```

### 2. Configurar Variables de Entorno

Copia `.env.local.example` a `.env.local` y configura:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database

# Clave de encriptación (32 caracteres)
ENCRYPTION_KEY=tu_clave_secreta_de_32_chars

# JWT para autenticación
JWT_SECRET=tu_secreto_jwt

# Meta WhatsApp API
WEBHOOK_VERIFY_TOKEN=tu_token_de_verificacion

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. Iniciar el Sistema

```bash
.\INICIAR.bat
```

Esto iniciará:
- **Backend** en `http://localhost:3001`
- **Frontend** en `http://localhost:3000`

## 📂 Estructura del Proyecto

```
chatmessages-bot/
├── app/                    # Frontend Next.js
│   ├── chats/             # Página principal de chat
│   ├── login/             # Autenticación
│   └── change-password/   # Cambio de contraseña
├── backend/               # Backend Express + Socket.IO
│   ├── config/            # Configuración BD
│   ├── middleware/        # Auth, rate limiting
│   ├── routes/            # API endpoints
│   ├── services/          # Message queue, circuit breaker, Meta API
│   └── utils/             # Encriptación
├── components/            # Componentes React
│   ├── chat/              # Componentes de chat
│   └── ui/                # shadcn/ui components
├── scripts/               # Scripts SQL y utilidades
└── lib/                   # Utilidades frontend
```

## 🔧 Scripts Disponibles

### Gestión del Sistema

- **`INICIAR.bat`** - Inicia frontend y backend
- **`REINICIAR-BACKEND.bat`** - Reinicia solo el backend
- **`KILL-3001.bat`** - Cierra proceso en puerto 3001
- **`INSTALAR-TODO.bat`** - Instala todas las dependencias

### Base de Datos

```bash
# Crear usuario
cd backend
npx tsx ../scripts/set-password.ts

# Resetear base de datos
npm run reset-db
```

## 🔐 Configuración de WhatsApp Business

### 1. Obtener Credenciales

1. Ve a [Meta Business Suite](https://business.facebook.com/)
2. Crea una aplicación de WhatsApp Business
3. Obtén:
   - **Phone Number ID** (number_id)
   - **Access Token** (jwt_token)
   - **Webhook Verify Token**

### 2. Configurar Webhook

En Meta Business Suite:

```
Webhook URL: https://tu-dominio.com/api/webhook/bot-message
Verify Token: (el que pusiste en WEBHOOK_VERIFY_TOKEN)
```

Suscríbete a: `messages`

### 3. Modo Desarrollo

En desarrollo solo puedes enviar mensajes a máximo **5 números verificados**:

1. WhatsApp → API Setup → Configuration
2. "To" → "Manage phone number list"
3. Agrega número y verifica con código SMS

## 🏗️ Arquitectura del Sistema

### Backend (Puerto 3001)

```
Express Server
  ├── Socket.IO (WebSocket)
  ├── PostgreSQL (con LISTEN/NOTIFY)
  ├── Message Queue (10 concurrentes)
  ├── Rate Limiter (200 msg/min)
  └── Circuit Breakers (Meta API + DB)
```

### Frontend (Puerto 3000)

```
Next.js App
  ├── Socket.IO Client
  ├── Chat Interface
  ├── Conversation List
  └── Real-time Updates
```

## 🔒 Seguridad

- **Encriptación AES-256-CBC** para mensajes en BD
- **JWT** para autenticación
- **Bcrypt** para passwords
- **Rate limiting** por IP y bot
- **Circuit breakers** para servicios externos

## 📊 Monitoreo

Endpoints de health check:

```
GET /api/health/detailed          # Estado completo
GET /api/health/queue             # Estado de la cola
GET /api/health/circuit-breakers  # Estado de circuit breakers
GET /api/health/rate-limits       # Estadísticas de rate limiting
```

## 🐛 Solución de Problemas

### Puerto 3001 en uso

```bash
.\KILL-3001.bat
```

### Mensajes no llegan a WhatsApp

Error común: `#131030 - Recipient phone number not in allowed list`

**Solución**: Agrega el número en Meta Business Suite (modo desarrollo)

### Base de datos no conecta

Verifica:
1. PostgreSQL está corriendo
2. `DATABASE_URL` en `.env.local` es correcta
3. Puedes conectarte con: `psql $DATABASE_URL`

## 🚀 Producción

Para producción:

1. **Verificar negocio** en Meta Business Manager
2. **Pasar a modo producción** en WhatsApp API
3. **Configurar HTTPS** (requerido por Meta)
4. **Variables de entorno** seguras
5. **Backups** de base de datos

## 📚 Tecnologías

### Backend
- Node.js + Express
- TypeScript
- Socket.IO
- PostgreSQL
- Axios

### Frontend
- Next.js 16
- React 19
- Socket.IO Client
- Tailwind CSS
- shadcn/ui

## 📝 Licencia

Este proyecto es privado.

## 🤝 Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.

---

**Sistema listo para usar** 🚀
