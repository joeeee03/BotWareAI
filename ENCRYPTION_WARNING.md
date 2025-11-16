# ⚠️ ADVERTENCIA CRÍTICA: ENCRYPTION_KEY

## 🔐 ¿Qué es ENCRYPTION_KEY?

`ENCRYPTION_KEY` es la clave maestra que tu aplicación usa para:
- ✅ **Encriptar TODOS los mensajes de chat** (contenido de mensajes)
- ✅ **Encriptar datos sensibles de bots** (tokens, webhooks, números de teléfono)
- ✅ **Desencriptar estos datos** cuando los usuarios los necesitan ver

## ⚠️ REGLAS CRÍTICAS

### 1. USA LA MISMA CLAVE EN TODOS LOS ENTORNOS

```bash
# En tu .env local
ENCRYPTION_KEY=d9G4kPq7V2sH6nZ1xR8bT3wL0yF5cM2a

# En Railway (producción)
ENCRYPTION_KEY=d9G4kPq7V2sH6nZ1xR8bT3wL0yF5cM2a
```

**DEBEN SER IDÉNTICAS** ☝️

### 2. NUNCA CAMBIES ESTA CLAVE

Si cambias `ENCRYPTION_KEY`:
- ❌ **Perderás acceso a TODOS los mensajes antiguos**
- ❌ **No podrás desencriptar datos de bots antiguos**
- ❌ **Los usuarios no podrán ver su historial de chat**
- ❌ **Los bots dejarán de funcionar**

### 3. MANTENLA SEGURA

- ✅ NO la subas a GitHub (está en `.gitignore`)
- ✅ NO la compartas públicamente
- ✅ NO la cambies sin razón
- ✅ Guárdala en un lugar seguro (password manager)

## 🚨 Escenarios de Problema

### Problema: "Usé una ENCRYPTION_KEY diferente en Railway"

**Síntoma:**
- Los mensajes aparecen como `[Encrypted Message - Unable to decrypt]`
- Los bots no pueden enviar mensajes
- Los datos sensibles no se pueden leer

**Solución:**
1. Ve a Railway → Variables
2. Cambia `ENCRYPTION_KEY` a tu clave local original
3. Guarda y espera que el servicio se reinicie
4. ✅ Todo volverá a funcionar

### Problema: "Perdí mi ENCRYPTION_KEY"

**Síntoma:**
- No encuentras tu clave original
- Los datos están encriptados con una clave desconocida

**Solución:**
- ❌ **No hay solución** - Los datos están permanentemente encriptados
- 😢 Necesitarás empezar con una base de datos nueva
- 💡 **Prevención**: Guarda tu clave en un password manager

### Problema: "Quiero cambiar mi ENCRYPTION_KEY"

**Respuesta:**
- ⚠️ **NO LO HAGAS** a menos que sea absolutamente necesario
- Si DEBES hacerlo, necesitarás:
  1. Desencriptar TODOS los mensajes con la clave vieja
  2. Re-encriptarlos con la clave nueva
  3. Actualizar TODOS los bots
  4. Es un proceso complejo y arriesgado

## ✅ Cómo Configurar Correctamente

### Paso 1: Encuentra tu clave local

Abre tu archivo `.env` o `backend/.env`:

```bash
# En Windows
notepad backend\.env

# Busca esta línea:
ENCRYPTION_KEY=d9G4kPq7V2sH6nZ1xR8bT3wL0yF5cM2a
```

### Paso 2: Copia EXACTAMENTE la misma clave

Copia el valor completo, carácter por carácter.

### Paso 3: Agrégala a Railway

1. Railway → Tu proyecto → Variables
2. Click "New Variable"
3. Variable: `ENCRYPTION_KEY`
4. Value: `d9G4kPq7V2sH6nZ1xR8bT3wL0yF5cM2a` (tu clave real)
5. ✅ Save

### Paso 4: Verifica

Una vez deployado:
1. Envía un mensaje de prueba
2. Refresca la página
3. ¿Puedes ver el mensaje? ✅ Correcto
4. ¿Ves `[Encrypted Message]`? ❌ Clave incorrecta

## 🔍 Cómo se Usa en el Código

### Encriptación de mensajes:

```typescript
// backend/utils/encryption.ts
export function encryptMessage(message: string): string {
  return encrypt(message); // Usa ENCRYPTION_KEY
}
```

### Desencriptación de mensajes:

```typescript
// backend/utils/message-decryption.ts
export function decrypt(encryptedText: string): string {
  // Usa ENCRYPTION_KEY para desencriptar
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
  return decrypted;
}
```

### Dónde se usa:

1. **Mensajes de chat** (`backend/routes/messages.ts`)
   - Se encriptan antes de guardar en DB
   - Se desencriptan al recuperarlos

2. **Datos de bots** (`backend/routes/bots.ts`)
   - Tokens de API encriptados
   - Webhooks encriptados
   - Números de teléfono encriptados

3. **Conversaciones** (`backend/routes/conversations.ts`)
   - Último mensaje encriptado

## 📝 Checklist de Seguridad

Antes de hacer deploy:
- [ ] Encontré mi `ENCRYPTION_KEY` local
- [ ] Copié el valor EXACTO (sin espacios extra)
- [ ] Lo agregué a Railway Variables
- [ ] Verifiqué que está escrito correctamente
- [ ] Guardé mi clave en un lugar seguro (password manager)
- [ ] NO hice commit de archivos `.env` a GitHub

Durante el deploy:
- [ ] El build completó exitosamente
- [ ] Los logs no muestran errores de encriptación
- [ ] Puedo enviar mensajes
- [ ] Puedo ver mensajes antiguos

Después del deploy:
- [ ] Los mensajes se leen correctamente
- [ ] Los bots funcionan
- [ ] No veo `[Encrypted Message]` en la UI

## 🆘 Soporte

Si tienes problemas con encriptación:

1. **Verifica la clave en Railway**
   ```
   Railway → Tu proyecto → Variables → ENCRYPTION_KEY
   ```

2. **Compárala con tu .env local**
   ```bash
   # Deben ser IDÉNTICAS
   ```

3. **Revisa los logs**
   ```
   Railway → Deployments → Ver logs
   # Busca: "[ENCRYPTION]" o "Decryption error"
   ```

4. **Si todo falla**
   - Asegúrate de tener un backup de tu clave
   - Considera empezar con una DB nueva si perdiste la clave
   - Contacta soporte con los logs específicos

---

## 🎯 Resumen

| ✅ HAZ ESTO | ❌ NO HAGAS ESTO |
|------------|------------------|
| Usa la misma clave en local y Railway | Generes una nueva clave para Railway |
| Guarda tu clave en un password manager | Cambies la clave sin razón |
| Verifica que los mensajes se lean | Hagas commit de tu .env |
| Mantén la clave segura | Compartas tu clave públicamente |

**🔑 LA REGLA DE ORO:**
> "La misma ENCRYPTION_KEY en desarrollo y producción, siempre."

---

**Última actualización:** Configuración para Railway Deployment
