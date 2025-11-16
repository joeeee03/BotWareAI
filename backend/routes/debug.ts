// [TAG: Debug]
// Endpoint para debug del sistema de polling en tiempo real

import { Router } from 'express'
import pkg from 'pg'

const { Pool } = pkg
const router = Router()

// GET /api/debug/recent-messages - Ver mensajes recientes
router.get('/recent-messages', async (req, res) => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    // Obtener los últimos 10 mensajes
    const query = `
      SELECT 
        m.id,
        m.conversation_id,
        m.bot_id,
        m.sender,
        m.message,
        m.created_at,
        b.user_id,
        c.customer_name,
        c.customer_phone
      FROM messages m
      JOIN bots b ON m.bot_id = b.id
      JOIN conversations c ON m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 10
    `
    
    const result = await pool.query(query)
    
    res.json({
      success: true,
      messages: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    })

    await pool.end()
  } catch (error) {
    console.error('[DEBUG] Error getting recent messages:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/debug/polling-status - Ver estado del polling
router.get('/polling-status', (req, res) => {
  res.json({
    success: true,
    polling: {
      active: true,
      interval: '1000ms',
      lastCheck: new Date().toISOString()
    },
    socket: {
      connected: true,
      rooms: ['Available via Socket.IO']
    }
  })
})

// POST /api/debug/test-message - Insertar mensaje de prueba
router.post('/test-message', async (req, res) => {
  try {
    const { conversationId, message = 'Mensaje de prueba desde debug' } = req.body

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId es requerido'
      })
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    // Obtener bot_id de la conversación
    const convQuery = `SELECT bot_id FROM conversations WHERE id = $1`
    const convResult = await pool.query(convQuery, [conversationId])
    
    if (convResult.rows.length === 0) {
      await pool.end()
      return res.status(404).json({
        success: false,
        error: 'Conversación no encontrada'
      })
    }

    const botId = convResult.rows[0].bot_id

    // Insertar mensaje de prueba
    const insertQuery = `
      INSERT INTO messages (conversation_id, bot_id, sender, message, created_at)
      VALUES ($1, $2, 'user', $3, NOW())
      RETURNING id, created_at
    `
    
    const result = await pool.query(insertQuery, [conversationId, botId, message])
    
    res.json({
      success: true,
      message: 'Mensaje de prueba insertado',
      data: result.rows[0],
      note: 'El mensaje debería aparecer en la UI en máximo 1 segundo'
    })

    await pool.end()
  } catch (error) {
    console.error('[DEBUG] Error inserting test message:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
