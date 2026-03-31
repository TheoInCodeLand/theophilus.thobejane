const { query } = require('../config/database');

class Document {
  static async getAll(options = {}) {
    const { category, status, limit, offset } = options;
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (status) {
      sql += ` AND index_status = $${paramIndex++}`;
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    if (limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    if (offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(offset);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  static async getById(id) {
    const result = await query('SELECT * FROM documents WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(docData) {
    const {
      filename, original_name, file_path, file_size, mime_type,
      category, description, vector_namespace
    } = docData;

    const result = await query(
      `INSERT INTO documents
       (filename, original_name, file_path, file_size, mime_type, category, description, vector_namespace)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [filename, original_name, file_path, file_size, mime_type, category, description, vector_namespace]
    );
    return result.rows[0];
  }

  static async updateIndexStatus(id, status, chunkCount = null) {
    const result = await query(
      `UPDATE documents
       SET index_status = $1, is_indexed = $2, chunk_count = COALESCE($3, chunk_count), updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, status === 'indexed', chunkCount, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query('DELETE FROM documents WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async getStats() {
    const result = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE index_status = 'indexed') as indexed,
        COUNT(*) FILTER (WHERE index_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE index_status = 'error') as error,
        SUM(chunk_count) as total_chunks
      FROM documents
    `);
    return result.rows[0];
  }

  static async getByCategory(category) {
    const result = await query(
      'SELECT * FROM documents WHERE category = $1 AND index_status = $2 ORDER BY created_at DESC',
      [category, 'indexed']
    );
    return result.rows;
  }
}

module.exports = Document;