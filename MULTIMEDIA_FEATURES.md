# 🎨 Funcionalidad Multimedia - Chat WhatsApp

## 📝 Resumen

Se ha implementado soporte completo para mensajes multimedia en la interfaz web de chat, permitiendo enviar y visualizar:
- 📝 Mensajes de texto
- 🖼️ Imágenes con caption
- 🎥 Videos con caption  
- 🎵 Audio (indicador)

## 🏗️ Arquitectura

### Base de Datos
```sql
-- Campos agregados a la tabla messages:
type VARCHAR(20) DEFAULT 'text'  -- Tipo: text, image, video, audio
url TEXT                         -- URL pública del archivo multimedia
```

### Backend (Express + Node.js)

#### Nuevas Rutas
```javascript
POST /api/upload/image    // Subir imagen (máx 50MB)
POST /api/upload/video    // Subir video (máx 50MB)
GET  /api/upload/test     // Verificar directorio de uploads
GET  /uploads/:filename   // Servir archivos estáticos
```

#### Archivos Modificados
- ✅ `backend/routes/upload.ts` - **NUEVO** - Rutas de upload
- ✅ `backend/routes/messages.ts` - Actualizado para soportar type/url
- ✅ `backend/routes/conversations.ts` - Incluye type/url en queries
- ✅ `backend/server.ts` - Configurado para servir archivos estáticos

### Frontend (Next.js + React)

#### Nuevos Componentes
```typescript
MultimediaMessage      // Renderiza mensajes según tipo
  ├─ TextMessage       // Texto con formato WhatsApp
  ├─ ImageMessage      // Imagen + caption
  ├─ VideoMessage      // Video + caption + controles
  └─ AudioMessage      // Indicador de audio
```

#### Archivos Modificados
- ✅ `components/chat/multimedia-message.tsx` - **NUEVO** - Componente multimedia
- ✅ `components/chat/message-thread.tsx` - Botones de adjuntar + vista previa
- ✅ `lib/api-client.ts` - Funciones uploadImage/uploadVideo

## 🎯 Flujo de Uso

### 1. Usuario adjunta archivo
```
Click botón imagen/video → Selecciona archivo → Vista previa → Confirma
```

### 2. Envío del mensaje
```
Frontend: Upload archivo → Backend: Guardar en /uploads → Retornar URL
Frontend: Enviar mensaje con type + url → Backend: Guardar en DB
Backend: Emitir evento Socket.IO → Frontend: Mostrar mensaje
```

### 3. Renderizado
```typescript
<MultimediaMessage 
  type="image" 
  message="Caption encriptado" 
  url="http://domain.com/uploads/BOT_IMG_123.jpg"
  sender="bot"
/>
```

## 🎨 Diseño Visual

### Estilo WhatsApp

**Mensajes del Usuario** (sender='user')
- Burbuja alineada a la **izquierda**
- Color: Gris claro (#F3F4F6) / Gris oscuro (#374151)
- Borde sutil

**Mensajes del Bot** (sender='bot')
- Burbuja alineada a la **derecha**
- Color: Azul (#2563EB)
- Texto blanco

### Multimedia

**Imágenes**
```tsx
<img 
  src={url} 
  className="max-w-xs rounded-lg"
  onLoad={handleLoad}
  onError={handleError}
/>
{caption && <p>{caption}</p>}
```

**Videos**
```tsx
<video controls className="max-w-sm">
  <source src={url} type="video/mp4" />
</video>
{caption && <p>{caption}</p>}
```

**Audio**
```tsx
<div>
  🎵 Audio {url ? <audio controls src={url} /> : '(no disponible)'}
</div>
```

## 🔒 Seguridad

### Validaciones Backend
```typescript
// Tipo de archivo
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime']

// Tamaño
maxFileSize: 50 * 1024 * 1024  // 50MB

// Nombres únicos
filename: `BOT_IMG_${Date.now()}.jpg`
```

### Autenticación
- Todos los endpoints requieren token JWT
- Middleware `authenticateToken` + `requirePasswordChange`

## 📦 Dependencias Nuevas

```json
{
  "multer": "^1.4.5-lts.1",
  "@types/multer": "^1.4.12"
}
```

Instalación:
```bash
cd backend
npm install multer @types/multer
```

## 🚀 Cómo Usar

### 1. Enviar Imagen desde el Chat

```typescript
// Usuario hace click en botón de imagen
const file = document.querySelector('input[type="file"]').files[0]

// Upload
const { url } = await apiClient.uploadImage(file)

// Enviar mensaje
await apiClient.sendMessage(
  conversationId, 
  'Caption de la imagen',  // Opcional
  undefined,
  'image',
  url
)
```

### 2. Recibir Mensaje con Multimedia

```typescript
// Socket.IO event
socket.on('message:new', (message) => {
  console.log(message)
  // {
  //   id: 123,
  //   sender: 'bot',
  //   message: 'Caption encriptado',
  //   type: 'image',
  //   url: 'https://domain.com/uploads/BOT_IMG_123.jpg',
  //   created_at: '2025-11-18T14:30:00Z'
  // }
})
```

### 3. Renderizar en UI

```tsx
<MultimediaMessage
  type={message.type || 'text'}
  message={message.message}
  url={message.url}
  sender={message.sender}
/>
```

## 🧪 Testing

Ver archivo `MULTIMEDIA_TESTING.md` para guía completa de pruebas.

### Quick Test

1. Iniciar backend: `cd backend && npm run dev`
2. Iniciar frontend: `npm run dev`
3. Abrir `http://localhost:3000/chats`
4. Seleccionar conversación
5. Click botón imagen → Seleccionar imagen → Enviar
6. Verificar que se muestra correctamente

## 📊 Estructura de Datos

### Mensaje de Texto
```json
{
  "type": "text",
  "message": "Hola, ¿cómo estás?",
  "url": null
}
```

### Mensaje con Imagen
```json
{
  "type": "image",
  "message": "Mirá esta foto",
  "url": "https://domain.com/uploads/BOT_IMG_1732046700123.jpg"
}
```

### Mensaje con Video
```json
{
  "type": "video",
  "message": "Tutorial de uso",
  "url": "https://domain.com/uploads/BOT_VID_1732046800456.mp4"
}
```

### Mensaje con Audio
```json
{
  "type": "audio",
  "message": null,
  "url": null  // Audio no se sube al servidor
}
```

## 🔧 Configuración

### Variables de Entorno

No se requieren nuevas variables. El sistema usa:
- `DATABASE_URL` - Conexión PostgreSQL
- `ENCRYPTION_KEY` - Encriptación de mensajes
- `JWT_SECRET` - Autenticación

### Directorios

El directorio `backend/public/uploads` se crea automáticamente.

En producción, considerar usar:
- AWS S3
- Cloudinary
- CDN para mejor rendimiento

## 🎯 Compatibilidad

### Navegadores
- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Móviles (iOS/Android)

### Formatos
- **Imágenes**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, MPEG, MOV, AVI (hasta 50MB)

## 💡 Mejoras Futuras

- [ ] Compresión automática de imágenes
- [ ] Generación de thumbnails para videos
- [ ] Upload con drag & drop
- [ ] Múltiples archivos simultáneos
- [ ] Integración con CDN
- [ ] Soporte para archivos PDF/documentos
- [ ] Envío de stickers
- [ ] Grabación de audio en el navegador

## 📚 Referencias

- [Multer Documentation](https://github.com/expressjs/multer)
- [Next.js Static Files](https://nextjs.org/docs/app/building-your-application/optimizing/static-assets)
- [WhatsApp Web Design](https://web.whatsapp.com)

---

**Estado**: ✅ Implementación completa y funcional
**Versión**: 1.0.0
**Fecha**: Noviembre 2025
