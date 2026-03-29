const { query } = require('../config/database');

class Settings {
  static async get(key) {
    const result = await query('SELECT value FROM settings WHERE key = $1', [key]);
    return result.rows[0]?.value;
  }

  static async getAll() {
    const result = await query('SELECT * FROM settings ORDER BY key');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  static async set(key, value) {
    const result = await query(
      `INSERT INTO settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, value]
    );
    return result.rows[0];
  }

  static async setMultiple(settings) {
    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      results.push(await this.set(key, value));
    }
    return results;
  }

  static async getPublicSettings() {
    const result = await query(`
      SELECT * FROM settings
      WHERE key IN ('site_title', 'site_description', 'author_name', 'author_role',
                    'github_url', 'twitter_url', 'linkedin_url', 'contact_email', 'theme')
    `);
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  }
}

module.exports = Settings;
