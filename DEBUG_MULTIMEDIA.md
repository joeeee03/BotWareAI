# 🔍 Debug: Imágenes no se envían a WhatsApp

## Problema Actual

- ✅ La imagen se sube correctamente al servidor
- ✅ La imagen se muestra en el chat interno
- ❌ La imagen NO se envía al usuario de WhatsApp

## Causa Más Probable

**La variable `PUBLIC_URL` NO está configurada en Railway**, por lo que:

1. Backend genera URL incorrecta: `http://localhost:3001/uploads/imagen.png`
2. WhatsApp intenta descargar desde esa URL
3. ❌ **Falla porque no es accesible públicamente**

## Solución Inmediata

### 1. Ve a Railway Dashboard

1. Abre tu proyecto en [railway.app](https://railway.app)
2. Selecciona tu servicio
3. Ve a la pestaña **"Variables"**

### 2. Agrega PUBLIC_URL

Agrega esta variable:

```
PUBLIC_URL=https://botwareai-production.up.railway.app
```

**IMPORTANTE:** Reemplaza con TU URL real de Railway (sin `/` al final)

### 3. Railway Reiniciará Automáticamente

Después de agregar la variable, Railway reiniciará el servicio (30-60 segundos).

## Verificar que Funciona

### Paso 1: Verifica los Logs

En Railway logs, busca:

```
[UPLOAD] Image uploaded successfully: {
  filename: 'BOT_IMG_...',
  url: 'https://botwareai-production.up.railway.app/uploads/BOT_IMG_...',
  baseUrl: 'https://botwareai-production.up.railway.app'
}
```

✅ **Correcto:** URL con `https://botwareai-production...`
❌ **Incorrecto:** URL con `http://localhost` o `http://127.0.0.1`

### Paso 2: Verifica que WhatsApp Recibe la Imagen

En los logs, busca:

```
[META-API] Sending image: {
  to: '549...',
  imageUrl: 'https://botwareai-production.up.railway.app/uploads/BOT_IMG_...',
  ...
}
```

Si la URL es correcta, debería aparecer:

```
[META-API] Image sent successfully: { ... }
```

### Paso 3: Prueba Manual de la URL

1. Sube una imagen desde el chat
2. Copia la URL del log
3. Pégala en el navegador
4. ✅ **Deberías ver la imagen**

Si vez la imagen en el navegador, WhatsApp también debería poder descargarla.

## Problemas Secundarios Posibles

### Problema 2: WhatsApp Requiere HTTPS

WhatsApp **REQUIERE URLs con HTTPS**. Railway provee HTTPS automáticamente, así que esto debería estar OK.

✅ `https://botwareai-production.up.railway.app/uploads/...`
❌ `http://botwareai-production.up.railway.app/uploads/...`

### Problema 3: Firewall/CORS

WhatsApp debe poder hacer GET a la URL sin autenticación. Ya configuramos:

```typescript
app.use("/uploads", express.static("public/uploads"))
```

Esto sirve archivos sin auth, así que debería funcionar.

## Checklist de Verificación

Marca cada item cuando lo hayas verificado:

- [ ] `PUBLIC_URL` está configurada en Railway
- [ ] Railway reinició después de agregar la variable
- [ ] Los logs muestran URL con `https://botwareai-production...`
- [ ] Puedes abrir la URL de la imagen en el navegador
- [ ] Los logs muestran `[META-API] Image sent successfully`
- [ ] El usuario de WhatsApp recibe la imagen

## Si Aún No Funciona

Comparte los logs de Railway (última parte después de subir una imagen):

1. Busca `[UPLOAD] Image uploaded successfully:`
2. Busca `[META-API] Sending image:`
3. Busca `[META-API] Image sent successfully:` o error

Con esos logs puedo identificar el problema exacto.
