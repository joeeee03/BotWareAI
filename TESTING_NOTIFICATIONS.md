# 🔔 Guía de Prueba de Notificaciones

## ✅ Cambios Implementados

### 1. **Inicialización de Audio Mejorada**
- El audio ahora se inicializa automáticamente cuando activas el sonido
- Si falla la inicialización automática, aparece un botón "Activar Audio" para inicializar manualmente
- El mensaje "Audio no inicializado" desaparece automáticamente cuando el audio está listo

### 2. **Separación de Sonido y Notificaciones**
- **Sonido**: Se reproduce SIEMPRE cuando está habilitado, independiente de las notificaciones
- **Notificaciones**: Requieren permisos del navegador y estar habilitadas
- Puedes tener solo sonido, solo notificaciones, o ambos

### 3. **Notificaciones en Menú de Configuración**
- Ve a **Configuración (⚙️)** → Pestaña **Notificaciones (🔔)**
- Allí puedes habilitar/deshabilitar sonidos y notificaciones por separado

---

## 🧪 Cómo Probar las Notificaciones

### **Paso 1: Configurar Notificaciones**

1. Abre la aplicación
2. Haz clic en el botón de **Configuración (⚙️)** en la parte superior
3. Ve a la pestaña **Notificaciones**
4. Verifica que estés en una de estas situaciones:

   #### Opción A: Con Permisos Concedidos ✅
   - Si dice "Permisos: Concedidos"
   - Asegúrate de que **"Notificaciones push"** esté activado (switch en azul)
   - Asegúrate de que **"Sonidos de notificación"** esté activado (switch en azul)

   #### Opción B: Sin Permisos ⏳
   - Si dice "Permisos: Pendientes"
   - Haz clic en **"Habilitar Notificaciones"**
   - Acepta los permisos cuando el navegador te lo pida
   - Activa ambos switches (Notificaciones push y Sonidos)

5. **IMPORTANTE**: Si aparece el mensaje "Audio no inicializado":
   - Haz clic en el botón **"Activar Audio"**
   - Espera a que diga "✅ Audio inicializado correctamente" en la consola
   - El mensaje amarillo debería desaparecer

### **Paso 2: Probar con el Botón de Prueba**

1. En la misma página de Notificaciones
2. Haz clic en el botón **"Probar Notificación"**
3. Deberías:
   - 🔊 **Escuchar un sonido** (si está habilitado)
   - 🔔 **Ver una notificación del sistema** (si tienes permisos)

### **Paso 3: Probar con Mensajes Reales**

#### **Caso 1: Ventana en Foco** (Estás viendo la aplicación)
1. Abre una conversación
2. Envía un mensaje desde WhatsApp (como usuario, no del bot)
3. Deberías **solo escuchar el sonido** (no notificación)
4. El mensaje aparecerá instantáneamente en el chat

#### **Caso 2: Ventana Fuera de Foco** (Estás en otra pestaña/app)
1. Abre una conversación
2. Cambia a otra pestaña o minimiza la ventana
3. Envía un mensaje desde WhatsApp
4. Deberías:
   - 🔊 **Escuchar el sonido**
   - 🔔 **Ver una notificación del sistema** con el nombre del remitente y el mensaje

---

## 🔍 Verificar en la Consola del Navegador

Abre la consola del navegador (F12) y busca estos mensajes:

### **Cuando activas el sonido:**
```
🔊 [NOTIFICATIONS] Inicializando AudioContext...
🔊 [NOTIFICATIONS] Reanudando AudioContext suspendido...
✅ [NOTIFICATIONS] AudioContext inicializado correctamente
🔊 [NOTIFICATIONS] Sonido message reproducido correctamente
```

### **Cuando llega un mensaje nuevo del usuario:**
```
🔔 [NOTIFICATIONS] Verificando mensaje para notificaciones: { sender: 'user', messageId: 123, ... }
🔔 [NOTIFICATIONS] Estado de la ventana: { isWindowFocused: false, isTabVisible: true, ... }
🔔 [NOTIFICATIONS] Enviando notificación para mensaje de: Juan Pérez
🔊 [NOTIFICATIONS] Reproduciendo sonido para notificación
🔊 [NOTIFICATIONS] Sonido message reproducido correctamente
🔔 [NOTIFICATIONS] Mostrando notificación del sistema
```

### **Cuando llega un mensaje del bot:**
```
🔔 [NOTIFICATIONS] Verificando mensaje para notificaciones: { sender: 'bot', messageId: 124, ... }
🔔 [NOTIFICATIONS] Mensaje del bot, no se envía notificación
```

---

## 🐛 Solución de Problemas

### **El sonido no se reproduce**

1. **Verifica que el audio esté inicializado:**
   - Ve a Configuración → Notificaciones
   - Si ves "Audio no inicializado", haz clic en "Activar Audio"

2. **Verifica el volumen del sistema:**
   - Asegúrate de que el volumen de tu PC/navegador no esté en mute

3. **Prueba manualmente:**
   - Ve a `/test-notifications` en la URL
   - Haz clic en "Probar Sonido"
   - Revisa la consola para ver errores

### **Las notificaciones no aparecen**

1. **Verifica los permisos:**
   - Ve a Configuración → Notificaciones
   - Debe decir "Permisos: Concedidos"
   - Si no, haz clic en "Habilitar Notificaciones"

2. **Verifica el estado del switch:**
   - "Notificaciones push" debe estar activado (azul)

3. **Verifica la configuración del navegador:**
   - Chrome: `chrome://settings/content/notifications`
   - Asegúrate de que el sitio tenga permisos

### **El mensaje "Audio no inicializado" no desaparece**

1. **Haz clic en el botón "Activar Audio":**
   - El navegador requiere una interacción del usuario para inicializar el audio
   - El botón fuerza la inicialización

2. **Recarga la página:**
   - A veces el estado puede quedar desincronizado
   - F5 para recargar

3. **Revisa la consola:**
   - Busca mensajes de error relacionados con AudioContext
   - Algunos navegadores pueden bloquear el audio

---

## 📝 Notas Técnicas

### **Comportamiento por Diseño**

- **Mensajes del usuario**: Siempre notifican (con sonido y/o notificación según config)
- **Mensajes del bot**: NUNCA notifican (para evitar spam de tus propias respuestas)
- **Ventana en foco**: Solo sonido (para no molestar cuando ya estás viendo la app)
- **Ventana fuera de foco**: Sonido + Notificación del sistema

### **Compatibilidad de Navegadores**

- ✅ Chrome/Edge: Totalmente compatible
- ✅ Firefox: Totalmente compatible
- ⚠️ Safari: Requiere permisos adicionales
- ❌ Safari iOS: Notificaciones push no soportadas (limitación del navegador)

### **Página de Prueba**

Accede a `/test-notifications` para una página de prueba dedicada con:
- Estado actual de permisos y configuración
- Botones para probar sonido y notificaciones por separado
- Información de debug en tiempo real
