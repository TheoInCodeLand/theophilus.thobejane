const { query } = require('../config/database');

class LabNote {
  static async getAll(options = {}) {
    const { limit } = options;
    let sql = 'SELECT * FROM lab_notes ORDER BY created_at DESC';
    const params = [];

    if (limit) {
      sql += ' LIMIT $1';
      params.push(limit);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  static async getById(id) {
    const result = await query('SELECT * FROM lab_notes WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(noteData) {
    const { title, description, content, link, icon } = noteData;

    const result = await query(
      `INSERT INTO lab_notes (title, description, content, link, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, content, link, icon]
    );
    return result.rows[0];
  }

  static async update(id, noteData) {
    const { title, description, content, link, icon } = noteData;

    const result = await query(
      `UPDATE lab_notes
       SET title = $1, description = $2, content = $3, link = $4, icon = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [title, description, content, link, icon, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query('DELETE FROM lab_notes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async getStats() {
    const result = await query('SELECT COUNT(*) as total FROM lab_notes');
    return result.rows[0];
  }
}

module.exports = LabNote;
