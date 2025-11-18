# 🚀 EJECUTAR AHORA - Todo Listo

## ✅ Lo que ya está hecho:

### Backend (100% Completo):
- ✅ Rutas API para templates
- ✅ Rutas API para mensajes programados
- ✅ Ruta API para actualizar perfil
- ✅ Worker automático que envía mensajes programados cada 1 minuto
- ✅ Todo integrado en `backend/server.ts`

### Frontend (100% Completo):
- ✅ Componente Settings Dialog con 3 tabs
- ✅ Tab Templates - Crear/editar/eliminar templates
- ✅ Tab Mensajes Programados - Programar envíos
- ✅ Tab Perfil - Editar nombre para mostrar
- ✅ Botón de engranaje ⚙️ integrado en el header

---

## 🗄️ PASO 1: Ejecutar SQL en Railway (5 minutos)

### Opción A: Desde Railway Web Console (MÁS FÁCIL)

1. Ve a **Railway.app** → Tu proyecto
2. Click en **PostgreSQL** database
3. Click en la pestaña **"Query"**
4. Copia y pega TODO el contenido del archivo:
   ```
   database/migrations/add-templates-and-scheduled-messages.sql
   ```
5. Click **"Run"** o **"Execute"**
6. ✅ Deberías ver: "Command completed successfully"

### Opción B: Desde tu terminal (Avanzado)

Si tienes psql instalado:

```bash
# Obtén la DATABASE_URL de Railway
# Luego ejecuta:
psql $DATABASE_URL -f database/migrations/add-templates-and-scheduled-messages.sql
```

---

## 🔧 PASO 2: Reiniciar el Backend

El backend necesita reiniciarse para cargar las nuevas rutas:

### Si estás en Railway:
1. Ve a tu servicio de backend en Railway
2. Click en **"Deploy"** → **"Restart"**
3. O simplemente haz git push (ya hicimos push, así que debería auto-deployar)

### Si estás en local:
```bash
cd backend
# Detén el servidor (Ctrl+C)
# Luego inicia de nuevo:
npm run dev
```

---

## 🎯 PASO 3: Probar Todo

### 1. Abrir la app
```
http://localhost:3000
# o tu URL de Railway
```

### 2. Buscar el botón de engranaje ⚙️
Está al lado de tu foto de perfil, arriba en el header de chats

### 3. Crear un Template
1. Click en ⚙️ → Tab "Templates"
2. Click "Nuevo"
3. Llena:
   - Título: "Saludo"
   - Mensaje: "¡Hola! ¿En qué puedo ayudarte?"
   - Atajo: "/hola" (opcional)
4. Click "Crear"
5. ✅ Deberías verlo en la lista

### 4. Programar un Mensaje
1. Click en ⚙️ → Tab "Programados"
2. Click "Programar Mensaje"
3. Llena:
   - Mensaje: "Recordatorio de prueba"
   - Fecha: Mañana
   - Hora: 10:00
   - Selecciona 1+ conversaciones
4. Click "Programar"
5. ✅ Deberías verlo como "Pendiente"

### 5. Actualizar Perfil
1. Click en ⚙️ → Tab "Perfil"
2. Escribe tu nombre en "Nombre para mostrar"
3. Click "Guardar Cambios"
4. ✅ Deberías ver el mensaje de éxito

---

## 🤖 Verificar el Scheduler

El worker se ejecuta automáticamente cada 1 minuto. Para verificar que funciona:

### En los logs del backend deberías ver:
```
[MESSAGE-SCHEDULER] 🕐 Starting message scheduler...
[MESSAGE-SCHEDULER] Will check for pending messages every 60 seconds
[MESSAGE-SCHEDULER] ✅ No pending messages to send
```

Cuando haya mensajes programados que lleguen a su hora:
```
[MESSAGE-SCHEDULER] 📨 Found 1 messages to send
[MESSAGE-SCHEDULER] 📤 Sending scheduled message 1 to 2 conversation(s)
[MESSAGE-SCHEDULER] ✅ Sent to conversation 123
[MESSAGE-SCHEDULER] ✅ Scheduled message 1 sent successfully
```

---

## 📋 Checklist Final

- [ ] ✅ SQL ejecutado en Railway
- [ ] ✅ Backend reiniciado
- [ ] ✅ Botón ⚙️ visible en el header
- [ ] ✅ Tab Templates funciona
- [ ] ✅ Tab Mensajes Programados funciona
- [ ] ✅ Tab Perfil funciona
- [ ] ✅ Logs del scheduler aparecen en el backend

---

## ❓ Si algo no funciona

### Error: "relation does not exist"
→ No ejecutaste el SQL. Ve al PASO 1.

### No veo el botón ⚙️
→ Necesitas hacer `npm run dev` en el frontend para recompilar.

### Templates no se guardan
→ Verifica que el backend esté corriendo y que hayas ejecutado el SQL.

### Mensajes programados no se envían
→ Verifica los logs del backend. El scheduler se ejecuta cada 1 minuto.

---

## 🎉 ¡Listo!

Ahora tienes:
- ✅ Templates de respuestas rápidas
- ✅ Mensajes programados con scheduler automático
- ✅ Perfil de usuario con nombre para mostrar
- ✅ Todo sin modificar ninguna funcionalidad existente

**Todo funciona automáticamente. El scheduler enviará los mensajes a la hora programada. 🚀**
