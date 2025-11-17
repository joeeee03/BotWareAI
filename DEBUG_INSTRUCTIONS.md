# 🐛 Instrucciones de Debug

## Problema del "Tú:" que no aparece

### Paso 1: Abrir la Consola del Navegador
1. Abre tu aplicación en Chrome/Edge
2. Presiona `F12` o `Ctrl+Shift+I`
3. Ve a la pestaña "Console"

### Paso 2: Buscar los Logs
Busca estos mensajes en la consola:

#### A) Al cargar la página:
```
[CHATS-PAGE] Sample conversation from API:
```
**Esto mostrará qué campos vienen del backend cuando cargas las conversaciones.**

Ejemplo de lo que deberías ver:
```javascript
{
  id: 123,
  last_message: "Hola, cómo estás?",
  last_message_sender: "bot",    // ← Este campo es el importante
  sender: "assistant",           // ← O puede venir con otro nombre
  allFields: ["id", "customer_name", "last_message", ...]
}
```

#### B) En la lista de conversaciones:
```
[CONVERSATION-LIST] First conversation sender:
```
**Esto muestra el valor del sender de la primera conversación en la lista.**

### Paso 3: Envía la Información
Copia y pega en el chat:
1. El output completo de `[CHATS-PAGE] Sample conversation from API:`
2. El output de `[CONVERSATION-LIST] First conversation sender:`
3. Dime si el último mensaje en esa conversación es del bot o del usuario

### Paso 4: Verificar Scroll
Al scrollear hacia arriba para cargar más mensajes, busca:
```
[MESSAGE-THREAD] 📍 Restored scroll:
```

Deberías ver algo como:
```javascript
{
  scrollHeightBefore: 5000,
  scrollHeightAfter: 8000,
  scrollDiff: 3000,
  scrollTopBefore: 100,
  newScrollTop: 3100,
  currentScrollTop: 3100
}
```

Si `currentScrollTop` es diferente a `newScrollTop`, el scroll no se está aplicando correctamente.

---

## ¿Por qué no aparece "Tú:"?

Posibles causas:
1. **Backend no envía `last_message_sender`** - El campo simplemente no viene
2. **Viene con otro nombre** - Ej: `sender`, `message_sender`, `from`, etc.
3. **Viene con valor diferente** - Ej: `"assistant"` en lugar de `"bot"`
4. **Solo viene por socket, no en la carga inicial** - Se actualiza solo al recibir mensajes nuevos

Una vez que me digas qué campos vienen, puedo corregir el código para que funcione.
