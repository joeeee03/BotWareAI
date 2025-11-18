# 🎨 GUÍA DE PRUEBAS: INTERFAZ DE CHAT CON MULTIMEDIA

## ✅ IMPLEMENTACIÓN COMPLETADA

Se ha implementado exitosamente una interfaz web estilo WhatsApp que soporta:
- ✅ Mensajes de texto
- ✅ Imágenes con caption
- ✅ Videos con caption
- ✅ Audio (solo indicador)

---

## 📋 COMPONENTES IMPLEMENTADOS

### Backend

#### 1. **Rutas de Upload** (`backend/routes/upload.ts`)
- `POST /api/upload/image` - Subir imágenes (hasta 50MB)
- `POST /api/upload/video` - Subir videos (hasta 50MB)
- `GET /api/upload/test` - Verificar directorio de uploads

#### 2. **Actualización de Rutas de Mensajes**
- `backend/routes/messages.ts` - Ahora soporta `type` y `url`
- `backend/routes/conversations.ts` - Incluye `type` y `url` en las consultas

#### 3. **Servicio de Archivos Estáticos**
- `backend/server.ts` - Configurado para servir `/uploads`

### Frontend

#### 1. **Componente MultimediaMessage** (`components/chat/multimedia-message.tsx`)
- Renderiza mensajes según su tipo
- Soporte para texto, imagen, video y audio
- Manejo de errores de carga
- Vista previa con loading states

#### 2. **MessageThread Actualizado** (`components/chat/message-thread.tsx`)
- Botones para adjuntar imagen y video
- Vista previa del archivo adjunto
- Indicador de progreso de subida
- Integración con MultimediaMessage

#### 3. **API Client** (`lib/api-client.ts`)
- `uploadImage(file)` - Subir imagen
- `uploadVideo(file)` - Subir video
- `sendMessage()` - Actualizado para soportar multimedia

---

## 🚀 CÓMO PROBAR

### 1. Iniciar el Backend

```powershell
cd backend
npm run dev
```

El servidor debería iniciar en `http://localhost:3001`

### 2. Iniciar el Frontend

```powershell
npm run dev
```

El frontend debería iniciar en `http://localhost:3000`

### 3. Probar la Funcionalidad

#### A) Enviar Imagen

1. Abrir la interfaz de chat en `http://localhost:3000/chats`
2. Seleccionar una conversación
3. Hacer clic en el botón de **imagen** (icono azul)
4. Seleccionar una imagen de tu computadora
5. Opcional: Agregar un caption en el campo de texto
6. Hacer clic en **Enviar**
7. Verificar que:
   - La imagen se sube correctamente
   - Se muestra en la conversación
   - El caption aparece debajo de la imagen (si lo agregaste)

#### B) Enviar Video

1. Hacer clic en el botón de **video** (icono morado)
2. Seleccionar un video de tu computadora (máx 50MB)
3. Opcional: Agregar un caption
4. Hacer clic en **Enviar**
5. Verificar que:
   - El video se sube correctamente
   - Se muestra con controles de reproducción
   - El caption aparece debajo del video (si lo agregaste)

#### C) Enviar Texto Simple

1. Escribir un mensaje en el campo de texto
2. Hacer clic en **Enviar**
3. Verificar que se muestra como mensaje de texto normal

---

## 🔍 VERIFICACIONES TÉCNICAS

### Base de Datos

Verificar que los campos `type` y `url` estén poblados:

```sql
SELECT id, sender, message, type, url, created_at 
FROM messages 
ORDER BY created_at DESC 
LIMIT 10;
```

Resultado esperado:
```
id | sender | message           | type  | url
---|--------|-------------------|-------|----------------------------------
1  | bot    | (encriptado)      | image | http://localhost:3001/uploads/BOT_IMG_123.jpg
2  | user   | (encriptado)      | text  | NULL
3  | bot    | (encriptado)      | video | http://localhost:3001/uploads/BOT_VID_456.mp4
```

### Archivos Subidos

Verificar que los archivos se guardan en:
```
backend/public/uploads/
```

Formato de nombres:
- Imágenes: `BOT_IMG_[timestamp].jpg`
- Videos: `BOT_VID_[timestamp].mp4`

### API Endpoints

Probar con curl o Postman:

```bash
# Test endpoint
GET http://localhost:3001/api/upload/test
Headers: Authorization: Bearer [tu_token]

# Upload image
POST http://localhost:3001/api/upload/image
Headers: Authorization: Bearer [tu_token]
Body: form-data
  file: [imagen]

# Upload video
POST http://localhost:3001/api/upload/video
Headers: Authorization: Bearer [tu_token]
Body: form-data
  file: [video]
```

---

## 🎨 CARACTERÍSTICAS DE LA INTERFAZ

### Mensajes de Usuario (izquierda)
- Fondo: Gris/Blanco (#F3F4F6 light mode, #374151 dark mode)
- Borde: Sutil
- Alineación: Izquierda

### Mensajes del Bot (derecha)
- Fondo: Azul (#2563EB)
- Texto: Blanco
- Alineación: Derecha

### Multimedia
- **Imágenes**: Se muestran con ancho máximo de 300-400px
- **Videos**: Controles nativos de HTML5
- **Audio**: Icono con mensaje "🎵 Audio"

### Vista Previa
- Antes de enviar, se muestra una vista previa del archivo
- Se puede eliminar el archivo con el botón X
- Se muestra el tamaño del archivo

---

## 🐛 TROUBLESHOOTING

### Error: "No se proporcionó ningún archivo"
- Verificar que estás enviando el archivo con el nombre de campo correcto: `file`

### Error: "Tipo de archivo no permitido"
- Solo se permiten:
  - Imágenes: jpeg, jpg, png, gif, webp
  - Videos: mp4, mpeg, quicktime, avi

### Error: "El archivo es demasiado grande"
- Límite: 50MB por archivo
- Reducir el tamaño del archivo antes de subirlo

### La imagen/video no se muestra
- Verificar que el servidor backend está corriendo
- Verificar que la URL apunta correctamente a `/uploads`
- Verificar que el archivo existe en `backend/public/uploads/`

### Los archivos no se guardan
- Verificar permisos de escritura en `backend/public/uploads/`
- El directorio se crea automáticamente si no existe

---

## 📊 ESQUEMA DE BASE DE DATOS

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  bot_id INTEGER REFERENCES bots(id),
  sender VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',  -- ✅ Nuevo
  url TEXT,                          -- ✅ Nuevo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 SEGURIDAD

✅ **Implementado**:
- Autenticación requerida para upload
- Validación de tipo de archivo
- Límite de tamaño de archivo (50MB)
- Nombres de archivo únicos (timestamp)

⚠️ **Recomendaciones adicionales**:
- Implementar rate limiting en los endpoints de upload
- Escaneo de virus en archivos subidos
- Compresión automática de imágenes grandes
- CDN para servir archivos estáticos en producción

---

## 📝 NOTAS IMPORTANTES

1. **Encriptación**: Los mensajes de texto (captions) están encriptados en la base de datos. Las URLs NO están encriptadas.

2. **Compatibilidad**: La interfaz funciona en:
   - Chrome/Edge (recomendado)
   - Firefox
   - Safari
   - Móviles (responsive)

3. **Formatos soportados**:
   - **Imágenes**: JPEG, PNG, GIF, WebP
   - **Videos**: MP4, MPEG, MOV, AVI

4. **Sin modificar código existente**: Toda la funcionalidad es **NUEVA** y no modifica el comportamiento actual de mensajes de texto.

---

## ✨ PRÓXIMOS PASOS (OPCIONAL)

- [ ] Agregar soporte para múltiples archivos
- [ ] Compresión automática de imágenes
- [ ] Subida con arrastrar y soltar (drag & drop)
- [ ] Miniaturas para videos
- [ ] Reproductor de audio personalizado
- [ ] Envío de archivos desde el webhook de WhatsApp

---

## 🎯 RESULTADO ESPERADO

Una interfaz web estilo WhatsApp donde:
1. ✅ Se ven todas las conversaciones del bot
2. ✅ Se pueden abrir y ver los mensajes de cada conversación
3. ✅ Los mensajes de texto se muestran desencriptados correctamente
4. ✅ Las imágenes se muestran usando las URLs públicas
5. ✅ Los videos se reproducen con controles nativos
6. ✅ Los usuarios pueden adjuntar y enviar imágenes/videos
7. ✅ Todo tiene un diseño limpio y profesional estilo WhatsApp
8. ✅ Es responsive y funciona en móviles

---

¡La implementación está completa y lista para usar! 🚀
