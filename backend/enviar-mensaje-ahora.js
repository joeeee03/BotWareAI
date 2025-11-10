// Script super simple para enviar UN mensaje AHORA
const axios = require('axios');

console.log('\n🚀 Enviando mensaje de prueba...\n');

const mensaje = `PRUEBA ${new Date().toLocaleTimeString()}`;

axios.post('http://localhost:3001/api/webhook/bot-message?key_bot=BOTKEY-PROD-0001', {
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
          profile: { name: "Cliente Test" },
          wa_id: "5491234567890"
        }],
        messages: [{
          from: "5491234567890",
          id: `msg_${Date.now()}`,
          timestamp: Math.floor(Date.now() / 1000).toString(),
          text: { body: mensaje },
          type: "text"
        }]
      },
      field: "messages"
    }]
  }]
})
.then(response => {
  console.log('✅ MENSAJE ENVIADO EXITOSAMENTE\n');
  console.log('📊 Respuesta:');
  console.log('   Conversation ID:', response.data.conversationId);
  console.log('   Message ID:', response.data.messageId);
  console.log('   Mensaje:', mensaje);
  console.log('\n👀 AHORA MIRA EL NAVEGADOR');
  console.log('   - El mensaje debe aparecer SIN REFRESCAR');
  console.log('   - Busca en DevTools logs con emoji 📨\n');
})
.catch(error => {
  console.error('\n❌ ERROR AL ENVIAR:\n');
  if (error.code === 'ECONNREFUSED') {
    console.error('⚠️  Backend NO está corriendo en puerto 3001');
    console.error('➡️  Inicia con: cd backend && npm run dev\n');
  } else if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', JSON.stringify(error.response.data, null, 2), '\n');
  } else {
    console.error(error.message, '\n');
  }
});
