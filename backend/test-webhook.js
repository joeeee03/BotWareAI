// Script para probar el webhook y mensajes en tiempo real
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  🧪 SIMULADOR DE WEBHOOK - TESTING EN TIEMPO REAL');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('📋 Configuración:');
console.log('   - Backend: ' + BASE_URL);
console.log('   - Bot Key: BOTKEY-PROD-0001');
console.log('   - Intervalo: 15 segundos');
console.log('');
console.log('✅ Para que esto funcione:');
console.log('   1. El backend debe estar corriendo en puerto 3001');
console.log('   2. El frontend debe estar corriendo en puerto 3000');
console.log('   3. Debes estar logueado en la UI');
console.log('   4. Debes tener DevTools abierto (F12)');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

let messageCount = 0;

// Simular un mensaje entrante de WhatsApp
async function simulateIncomingMessage() {
  messageCount++;
  const timestamp = new Date().toLocaleTimeString();
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📨 ENVIANDO MENSAJE #${messageCount} - ${timestamp}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  try {
    const messageText = `Mensaje de prueba #${messageCount} - ${timestamp}`;
    const webhookData = {
      object: "whatsapp_business_account",
      entry: [{
        id: "ENTRY_ID",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "1234567890",
              phone_number_id: "PHONE_NUMBER_ID"
            },
            contacts: [{
              profile: {
                name: "Cliente Test"
              },
              wa_id: "5491234567890"
            }],
            messages: [{
              from: "5491234567890",
              id: `msg_${Date.now()}`,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              text: {
                body: messageText
              },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };

    console.log('📤 Mensaje: "' + messageText + '"');
    console.log('🌐 Enviando al webhook...');
    
    const response = await axios.post(
      `${BASE_URL}/api/webhook/bot-message?key_bot=BOTKEY-PROD-0001`,
      webhookData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    console.log('');
    console.log('✅ WEBHOOK PROCESADO EXITOSAMENTE');
    console.log('   Conversation ID:', response.data.conversationId);
    console.log('   Message ID:', response.data.messageId);
    console.log('');
    console.log('👀 VERIFICA EN EL NAVEGADOR:');
    console.log('   1. ¿Ves el mensaje aparecer en el chat?');
    console.log('   2. ¿Se reordenó la conversación arriba?');
    console.log('   3. En DevTools, busca logs con emojis: 📨 🔄');
    console.log('');
    console.log('🔍 VERIFICA EN EL BACKEND:');
    console.log('   Deberías ver en la consola del backend:');
    console.log('   📤 [WEBHOOK] Emitting message:new to room: conversation_X');
    console.log('   📤 [WEBHOOK] Emitting conversation:updated to room: user_X');
    console.log('');
    
  } catch (error) {
    console.log('');
    console.error('❌ ERROR AL ENVIAR MENSAJE');
    if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Backend NO está corriendo en puerto 3001');
      console.error('   ➡️  Inicia el backend con: cd backend && npm run dev');
    } else if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Mensaje:', error.message);
    }
    console.log('');
  }
}

// Ejecutar cada 15 segundos para probar (menos agresivo)
console.log('🔄 Iniciando simulador de mensajes...');
console.log('📱 Se enviará un mensaje cada 15 segundos');
console.log('⏹️  Presiona Ctrl+C para detener');
console.log('🌐 Asegúrate de que el frontend esté en http://localhost:3000');

// Enviar primer mensaje después de 3 segundos
setTimeout(simulateIncomingMessage, 3000);

// Luego cada 15 segundos
setInterval(simulateIncomingMessage, 15000);
