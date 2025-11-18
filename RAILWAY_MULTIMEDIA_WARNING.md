# ⚠️ ADVERTENCIA IMPORTANTE: Almacenamiento de Archivos en Railway

## El Problema

**Railway usa almacenamiento EFÍMERO** (temporal). Esto significa:

- ✅ Los archivos se suben correctamente
- ✅ Los archivos funcionan mientras el contenedor está corriendo
- ❌ **Los archivos SE PIERDEN cuando el contenedor se reinicia o redeploya**

Railway reinicia contenedores en estas situaciones:
- Cuando haces un nuevo deploy
- Cuando cambias variables de entorno
- Cuando el servicio se queda sin recursos
- Mantenimiento de Railway

## Solución Temporal (Ya Aplicada)

He arreglado el error 404 con estos cambios:

### 1. **`server-combined.js`**
```javascript
// Ahora redirige /uploads al backend
const isBackend = url.startsWith('/api/') || 
                  url.startsWith('/socket.io') || 
                  url.startsWith('/uploads/') ||  // ← NUEVO
                  url === '/health';
```

### 2. **`Dockerfile`**
```dockerfile
# Crea el directorio uploads en el contenedor
RUN mkdir -p /app/public/uploads && chmod 777 /app/public/uploads
```

**Ahora los archivos SÍ se sirven correctamente**, PERO se perderán al reiniciar.

## Soluciones Permanentes

Para un sistema en producción, DEBES usar almacenamiento externo:

### Opción 1: Cloudinary (Recomendado - Gratis hasta 25GB)

**Pasos:**
1. Crea cuenta en [cloudinary.com](https://cloudinary.com)
2. Instala el SDK:
```bash
npm install cloudinary
```

3. Modifica `backend/routes/upload.ts`:
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// En lugar de guardar localmente:
const result = await cloudinary.uploader.upload(req.file.path, {
  folder: 'whatsapp-bot',
});

// Retornar la URL de Cloudinary
res.json({
  success: true,
  url: result.secure_url, // ← Esta URL es permanente
});
```

4. Agrega las variables en Railway:
```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

### Opción 2: AWS S3

**Pasos:**
1. Crea un bucket S3 en AWS
2. Instala SDK:
```bash
npm install @aws-sdk/client-s3
```

3. Modifica `backend/routes/upload.ts` para subir a S3
4. Configura variables de entorno en Railway

### Opción 3: Railway Volumes (Requiere plan pago)

Railway ofrece volúmenes persistentes, pero:
- ❌ Requiere plan Team ($20/mes)
- ❌ Más complejo de configurar
- ✅ Archivos se guardan en Railway

## Solución Inmediata (Mientras decides)

**Los archivos funcionarán correctamente hasta el próximo deploy.**

Para testing:
- Sube una imagen
- Verifica que aparece en: `https://tu-app.railway.app/uploads/BOT_IMG_xxx.png`
- El archivo existirá hasta que hagas redeploy

**Para producción real**: Implementa Cloudinary (es gratis y fácil).

## Implementación de Cloudinary - Guía Rápida

1. **Instala la dependencia**:
```bash
cd backend
npm install cloudinary
```

2. **Crea archivo** `backend/config/cloudinary.ts`:
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

3. **Modifica** `backend/routes/upload.ts` (ejemplo para imágenes):
```typescript
import cloudinary from '../config/cloudinary.js';

router.post("/image", authenticateToken, requirePasswordChange, upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Upload to Cloudinary instead of local storage
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'whatsapp-bot/images',
      resource_type: 'image',
    });

    console.log("[UPLOAD] Image uploaded to Cloudinary:", {
      url: result.secure_url,
      size: req.file.size,
    });

    res.json({
      success: true,
      url: result.secure_url, // Permanent URL
      filename: result.public_id,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: any) {
    console.error("[UPLOAD] Error uploading to Cloudinary:", error);
    res.status(500).json({ error: error.message });
  }
});
```

4. **En Railway**, agrega las variables de entorno:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

5. **Redeploy** y listo - archivos permanentes ✅

## Resumen

- ✅ **Ahora**: Los archivos funcionan (hasta el próximo deploy)
- ⚠️ **Problema**: Se pierden al reiniciar
- 🎯 **Solución**: Usa Cloudinary (15 minutos de configuración)
