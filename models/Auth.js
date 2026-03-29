const { query } = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class Auth {
  // Hash password
  static async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  // Verify password
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Create user
  static async createUser(username, password, role = 'admin') {
    const passwordHash = await this.hashPassword(password);
    const result = await query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role, created_at`,
      [username, passwordHash, role]
    );
    return result.rows[0];
  }

  // Find user by username
  static async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  // Create session
  static async createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const result = await query(
      `INSERT INTO sessions (user_id, session_token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, token, expiresAt]
    );
    return result.rows[0];
  }

  // Find session by token
  static async findSession(token) {
    const result = await query(
      `SELECT s.*, u.username, u.role 
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );
    return result.rows[0];
  }

  // Delete session (logout)
  static async deleteSession(token) {
    await query('DELETE FROM sessions WHERE session_token = $1', [token]);
  }

  // Clean expired sessions
  static async cleanExpiredSessions() {
    await query('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP');
  }
}

module.exports = Auth;