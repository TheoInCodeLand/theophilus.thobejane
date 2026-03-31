const { query } = require('../config/database');

class Chat {
  static async createSession(visitorId = null, userAgent = null, ipAddress = null) {
    const result = await query(
      `INSERT INTO chat_sessions (visitor_id, user_agent, ip_address)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [visitorId, userAgent, ipAddress]
    );
    return result.rows[0];
  }

  static async getSession(sessionId) {
    const result = await query('SELECT * FROM chat_sessions WHERE session_id = $1', [sessionId]);
    return result.rows[0];
  }

  static async addMessage(sessionId, role, content, metadata = null) {
    const result = await query(
      `INSERT INTO chat_messages (session_id, role, content, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sessionId, role, content, metadata]
    );
    
    // Update message count in session
    await query(
      `UPDATE chat_sessions SET message_count = message_count + 1 WHERE session_id = $1`,
      [sessionId]
    );
    
    return result.rows[0];
  }

  static async getSessionMessages(sessionId, limit = 50) {
    const result = await query(
      `SELECT * FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC 
       LIMIT $2`,
      [sessionId, limit]
    );
    return result.rows;
  }

  static async getRecentSessions(limit = 20) {
    const result = await query(
      `SELECT * FROM chat_sessions 
       ORDER BY started_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  static async getAnalytics(days = 30) {
    const result = await query(
      `SELECT 
        date,
        total_sessions,
        total_messages,
        avg_response_time_ms,
        top_queries
       FROM chat_analytics
       WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date DESC`
    );
    return result.rows;
  }

  static async updateAnalytics(date, data) {
    const result = await query(
      `INSERT INTO chat_analytics (date, total_sessions, total_messages, avg_response_time_ms, top_queries, sources_used)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (date) DO UPDATE SET
         total_sessions = chat_analytics.total_sessions + EXCLUDED.total_sessions,
         total_messages = chat_analytics.total_messages + EXCLUDED.total_messages,
         avg_response_time_ms = EXCLUDED.avg_response_time_ms,
         top_queries = EXCLUDED.top_queries,
         sources_used = EXCLUDED.sources_used
       RETURNING *`,
      [date, data.total_sessions, data.total_messages, data.avg_response_time_ms, data.top_queries, data.sources_used]
    );
    return result.rows[0];
  }
}

module.exports = Chat;