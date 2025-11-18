# Fix: Envío de Imágenes y Videos a WhatsApp

## Problema Resuelto

Se corrigió el error "Internal server error" al enviar imágenes y videos. El problema era que el backend **no estaba enviando los archivos multimedia a la API de WhatsApp**.

## Cambios Realizados

### 1. **Servicio Meta API (`backend/services/meta-api.ts`)**
- ✅ Agregado método `sendImageMessage()` para enviar imágenes a WhatsApp
- ✅ Agregado método `sendVideoMessage()` para enviar videos a WhatsApp

### 2. **Rutas de Mensajes (`backend/routes/messages.ts`)**
- ✅ Modificada la lógica para detectar el tipo de mensaje (text/image/video)
- ✅ Usa el método correcto de la API de Meta según el tipo:
  - `type === 'image'` → `sendImageMessage()`
  - `type === 'video'` → `sendVideoMessage()`
  - `type === 'text'` → `sendTextMessage()`

### 3. **URLs Públicas (`backend/routes/upload.ts`)**
- ✅ Agregado soporte para variable de entorno `PUBLIC_URL`
- ✅ Genera URLs accesibles públicamente para que WhatsApp pueda descargar los archivos

### 4. **Configuración de Entorno (`.env.example`)**
- ✅ Agregada variable `PUBLIC_URL` con documentación

## Configuración Requerida

### Para Desarrollo Local

En tu archivo `.env` o `.env.local`, agrega:

```env
PUBLIC_URL=http://localhost:3001
```

**IMPORTANTE:** Para que funcione en desarrollo local con WhatsApp:
- Necesitas exponer tu servidor local a internet usando herramientas como:
  - **ngrok**: `ngrok http 3001`
  - **localtunnel**: `lt --port 3001`
  - **Cloudflare Tunnel**

Luego usa la URL pública generada:
```env
PUBLIC_URL=https://tu-url-temporal.ngrok.io
```

### Para Producción (Railway/Heroku/etc)

Configura la variable de entorno `PUBLIC_URL` con la URL pública de tu backend:

```env
PUBLIC_URL=https://tu-backend.railway.app
```

## Cómo Funciona Ahora

1. **Usuario adjunta imagen/video** en el chat
2. **Frontend sube archivo** a `/api/upload/image` o `/api/upload/video`
3. **Backend guarda archivo** en `public/uploads/`
4. **Backend genera URL pública**: `https://tu-servidor.com/uploads/BOT_IMG_123.jpg`
5. **Backend envía mensaje a WhatsApp** con la URL de la imagen/video
6. **WhatsApp descarga el archivo** desde esa URL y lo entrega al destinatario

## Verificación

Para verificar que todo funciona:

1. **Reinicia el servidor backend**
2. **Adjunta una imagen** en el chat
3. **Verifica en los logs del backend**:
   - `[UPLOAD] Image uploaded successfully: { url: '...' }`
   - `[META-API] Sending image: { imageUrl: '...' }`
   - `[META-API] Image sent successfully`

## Solución de Problemas

### Error: "Upload failed"
- Verifica que la carpeta `public/uploads/` existe
- Verifica permisos de escritura

### Error: WhatsApp no descarga la imagen
- Verifica que `PUBLIC_URL` apunta a una URL accesible públicamente
- Verifica que `/uploads` está configurado como ruta estática en `server.ts`
- Verifica que el servidor usa HTTPS en producción (WhatsApp requiere HTTPS)

### La imagen se sube pero no se envía
- Verifica los logs: `[META-API] Sending image`
- Verifica credenciales de Meta API en `.env`
- Verifica que el bot tiene permisos para enviar multimedia

## Notas Técnicas

- **Tamaño máximo**: 50MB (configurado en `upload.ts`)
- **Formatos soportados**:
  - Imágenes: JPEG, PNG, GIF, WebP
  - Videos: MP4, MPEG, QuickTime, AVI
- **Los archivos se almacenan localmente** en `public/uploads/`
- **Caption opcional**: Si el usuario escribe texto con la imagen, se envía como caption

## Próximos Pasos (Opcional)

Para producción profesional, considera:
- Usar almacenamiento en la nube (AWS S3, Cloudinary)
- Implementar limpieza automática de archivos antiguos
- Agregar compresión de imágenes antes de subir
