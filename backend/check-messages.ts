import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkMessages() {
  try {
    console.log('=== CHECKING MESSAGES AND CONVERSATIONS ===');
    
    // Check conversations
    const conversations = await pool.query('SELECT * FROM conversations LIMIT 5');
    console.log('\n--- CONVERSATIONS ---');
    console.log('Count:', conversations.rowCount);
    conversations.rows.forEach(conv => {
      console.log(`ID: ${conv.id}, Bot: ${conv.bot_id}, Phone: ${conv.customer_phone}, Name: ${conv.customer_name}`);
    });
    
    // Check messages
    const messages = await pool.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 10');
    console.log('\n--- RECENT MESSAGES ---');
    console.log('Count:', messages.rowCount);
    messages.rows.forEach(msg => {
      console.log(`ID: ${msg.id}, Conv: ${msg.conversation_id}, Sender: ${msg.sender}, Message: "${msg.message}"`);
    });
    
    // Check if we have any data to test with
    if (conversations.rowCount === 0) {
      console.log('\n⚠️  No conversations found. Let me add some test data...');
      
      // Add a test conversation
      const testConv = await pool.query(`
        INSERT INTO conversations (bot_id, customer_phone, customer_name, created_at)
        VALUES (3, '+1234567890', 'Test Customer', NOW())
        RETURNING id
      `);
      
      const convId = testConv.rows[0].id;
      console.log('✅ Created test conversation:', convId);
      
      // Add some test messages
      await pool.query(`
        INSERT INTO messages (conversation_id, bot_id, sender, message, created_at) VALUES
        ($1, 3, 'bot', 'Hello! Welcome to our service. How can I help you today?', NOW() - INTERVAL '10 minutes'),
        ($1, 3, 'user', 'Hi! I need help with my order.', NOW() - INTERVAL '9 minutes'),
        ($1, 3, 'bot', 'I''d be happy to help you with your order. Can you provide your order number?', NOW() - INTERVAL '8 minutes'),
        ($1, 3, 'user', 'Sure, it''s #12345', NOW() - INTERVAL '7 minutes'),
        ($1, 3, 'bot', 'Thank you! Let me look that up for you. One moment please...', NOW() - INTERVAL '6 minutes')
      `, [convId]);
      
      console.log('✅ Added test messages');
      
      // Show the new messages
      const newMessages = await pool.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at', [convId]);
      console.log('\n--- TEST MESSAGES ADDED ---');
      newMessages.rows.forEach(msg => {
        console.log(`${msg.sender}: "${msg.message}"`);
      });
    }
    
  } catch (error) {
    console.error('Error checking messages:', error);
  } finally {
    await pool.end();
  }
}

checkMessages();
