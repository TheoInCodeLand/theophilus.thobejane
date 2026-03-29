const { query } = require('../config/database');

class WorkbenchItem {
  static async getAll(options = {}) {
    const { status, limit } = options;
    let sql = 'SELECT * FROM workbench_items';
    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` WHERE status = $${paramIndex++}`;
      params.push(status);
    }

    sql += ' ORDER BY priority DESC, created_at DESC';

    if (limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  static async getById(id) {
    const result = await query('SELECT * FROM workbench_items WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(itemData) {
    const { title, description, progress, status, priority } = itemData;

    const result = await query(
      `INSERT INTO workbench_items (title, description, progress, status, priority)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, progress, status, priority]
    );
    return result.rows[0];
  }

  static async update(id, itemData) {
    const { title, description, progress, status, priority } = itemData;

    const result = await query(
      `UPDATE workbench_items
       SET title = $1, description = $2, progress = $3, status = $4, priority = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [title, description, progress, status, priority, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query('DELETE FROM workbench_items WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async getStats() {
    const result = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'paused') as paused,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM workbench_items
    `);
    return result.rows[0];
  }
}

module.exports = WorkbenchItem;
