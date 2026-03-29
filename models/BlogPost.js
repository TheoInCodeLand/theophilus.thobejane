const { query } = require('../config/database');

class BlogPost {
  static async getAll(options = {}) {
    const { category, featured, published, limit, offset, tag } = options;
    let sql = `
      SELECT bp.*, c.name as category_name, c.slug as category_slug
      FROM blog_posts bp
      LEFT JOIN categories c ON bp.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND c.slug = $${paramIndex++}`;
      params.push(category);
    }

    if (featured !== undefined) {
      sql += ` AND bp.featured = $${paramIndex++}`;
      params.push(featured);
    }

    if (published !== undefined) {
      sql += ` AND bp.published = $${paramIndex++}`;
      params.push(published);
    }

    if (tag) {
      sql += ` AND $${paramIndex++} = ANY(bp.tags)`;
      params.push(tag);
    }

    sql += ' ORDER BY bp.featured DESC, bp.published_at DESC NULLS LAST, bp.created_at DESC';

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
    const result = await query(
      `SELECT bp.*, c.name as category_name, c.slug as category_slug
       FROM blog_posts bp
       LEFT JOIN categories c ON bp.category_id = c.id
       WHERE bp.slug = $1`,
      [slug]
    );
    return result.rows[0];
  }

  static async getById(id) {
    const result = await query(
      `SELECT bp.*, c.name as category_name, c.slug as category_slug
       FROM blog_posts bp
       LEFT JOIN categories c ON bp.category_id = c.id
       WHERE bp.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(postData) {
    const {
      title, slug, excerpt, content, category_id, tags,
      featured, author_name, author_role, read_time, published, published_at
    } = postData;

    const result = await query(
      `INSERT INTO blog_posts
       (title, slug, excerpt, content, category_id, tags, featured,
        author_name, author_role, read_time, published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [title, slug, excerpt, content, category_id, tags, featured,
       author_name, author_role, read_time, published, published_at]
    );
    return result.rows[0];
  }

  static async update(id, postData) {
    const {
      title, slug, excerpt, content, category_id, tags,
      featured, author_name, author_role, read_time, published, published_at
    } = postData;

    const result = await query(
      `UPDATE blog_posts
       SET title = $1, slug = $2, excerpt = $3, content = $4, category_id = $5,
           tags = $6, featured = $7, author_name = $8, author_role = $9,
           read_time = $10, published = $11, published_at = $12,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [title, slug, excerpt, content, category_id, tags, featured,
       author_name, author_role, read_time, published, published_at, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query('DELETE FROM blog_posts WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async getStats() {
    const result = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE featured = true) as featured,
        COUNT(*) FILTER (WHERE published = true) as published
      FROM blog_posts
    `);
    return result.rows[0];
  }

  static async getCategories() {
    const result = await query(`
      SELECT c.*, COUNT(bp.id) as post_count
      FROM categories c
      LEFT JOIN blog_posts bp ON c.id = bp.category_id AND bp.published = true
      GROUP BY c.id
      ORDER BY c.name
    `);
    return result.rows;
  }

  static async getAllTags() {
    const result = await query('SELECT DISTINCT unnest(tags) as tag FROM blog_posts WHERE tags IS NOT NULL');
    return result.rows.map(row => row.tag);
  }

  static async search(searchQuery) {
    const result = await query(
      `SELECT bp.*, c.name as category_name, c.slug as category_slug
       FROM blog_posts bp
       LEFT JOIN categories c ON bp.category_id = c.id
       WHERE (bp.title ILIKE $1 OR bp.excerpt ILIKE $1 OR bp.content ILIKE $1 OR $1 = ANY(bp.tags))
       AND bp.published = true
       ORDER BY bp.published_at DESC NULLS LAST`,
      [`%${searchQuery}%`]
    );
    return result.rows;
  }
}

module.exports = BlogPost;
