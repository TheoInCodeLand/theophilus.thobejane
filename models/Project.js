const { query } = require('../config/database');

class Project {
  static async getAll(options = {}) {
    const { status, featured, limit, offset } = options;
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (featured !== undefined) {
      sql += ` AND featured = $${paramIndex++}`;
      params.push(featured);
    }

    sql += ' ORDER BY featured DESC, year DESC, created_at DESC';

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

  static async getBySlug(slug) {
    const result = await query('SELECT * FROM projects WHERE slug = $1', [slug]);
    return result.rows[0];
  }

  static async getById(id) {
    const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(projectData) {
    const {
      title, slug, description, long_description, status, year,
      featured, highlight, github_url, live_url, stars, forks, tags
    } = projectData;

    const result = await query(
      `INSERT INTO projects
       (title, slug, description, long_description, status, year, featured, highlight, github_url, live_url, stars, forks, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [title, slug, description, long_description, status, year, featured, highlight, github_url, live_url, stars, forks, tags]
    );
    return result.rows[0];
  }

  static async update(id, projectData) {
    const {
      title, slug, description, long_description, status, year,
      featured, highlight, github_url, live_url, stars, forks, tags
    } = projectData;

    const result = await query(
      `UPDATE projects
       SET title = $1, slug = $2, description = $3, long_description = $4,
           status = $5, year = $6, featured = $7, highlight = $8,
           github_url = $9, live_url = $10, stars = $11, forks = $12, tags = $13,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [title, slug, description, long_description, status, year, featured, highlight,
       github_url, live_url, stars, forks, tags, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async getStats() {
    const result = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
        COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'archived') as archived
      FROM projects
    `);
    return result.rows[0];
  }

  static async getAllTags() {
    const result = await query('SELECT DISTINCT unnest(tags) as tag FROM projects WHERE tags IS NOT NULL');
    return result.rows.map(row => row.tag);
  }

  static async search(searchQuery) {
    const result = await query(
      `SELECT * FROM projects
       WHERE title ILIKE $1 OR description ILIKE $1 OR $1 = ANY(tags)
       ORDER BY featured DESC, year DESC`,
      [`%${searchQuery}%`]
    );
    return result.rows;
  }
}

module.exports = Project;
