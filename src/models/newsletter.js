/**
 * Newsletter Database Model
 * 
 * Provides CRUD operations for daily_newsletters table
 */

import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

// Create connection pool
console.log('🔍 Database URL:', config.databaseUrl ? 'SET' : 'UNDEFINED');
console.log('🔍 Database URL length:', config.databaseUrl?.length);
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database pool connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

/**
 * Newsletter Model
 */
export const Newsletter = {
  /**
   * Create or update newsletter (UPSERT)
   * If a newsletter already exists for the same publish_date, it will be updated.
   * This ensures only the latest newsletter is kept for each day.
   */
  async create(data) {
    const query = `
      INSERT INTO daily_newsletters (
        publish_date, title, hook, sections, conclusion, sources,
        audio_url, audio_duration_seconds, generation_status, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (publish_date)
      DO UPDATE SET
        title = EXCLUDED.title,
        hook = EXCLUDED.hook,
        sections = EXCLUDED.sections,
        conclusion = EXCLUDED.conclusion,
        sources = EXCLUDED.sources,
        audio_url = EXCLUDED.audio_url,
        audio_duration_seconds = EXCLUDED.audio_duration_seconds,
        generation_status = EXCLUDED.generation_status,
        error_message = EXCLUDED.error_message,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [
      data.publish_date,
      data.title,
      data.hook,
      JSON.stringify(data.sections || []),
      data.conclusion,
      JSON.stringify(data.sources || []),
      data.audio_url || null,
      data.audio_duration_seconds || null,
      data.generation_status || 'pending',
      data.error_message || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Get newsletter by publish date
   */
  async getByDate(publishDate) {
    const query = `
      SELECT * FROM daily_newsletters
      WHERE publish_date = $1
    `;
    const result = await pool.query(query, [publishDate]);
    return result.rows[0] || null;
  },

  /**
   * Get latest newsletter
   */
  async getLatest() {
    const query = `
      SELECT * FROM daily_newsletters
      WHERE generation_status = 'complete'
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    return result.rows[0] || null;
  },

  /**
   * Get newsletter history (last N days)
   */
  async getHistory(limit = 30) {
    const query = `
      SELECT * FROM daily_newsletters
      WHERE generation_status = 'complete'
      ORDER BY publish_date DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  },

  /**
   * Update newsletter
   */
  async update(publishDate, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'sections' || key === 'sources') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    });

    values.push(publishDate);

    const query = `
      UPDATE daily_newsletters
      SET ${fields.join(', ')}
      WHERE publish_date = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  /**
   * Delete newsletter
   */
  async delete(publishDate) {
    const query = `
      DELETE FROM daily_newsletters
      WHERE publish_date = $1
      RETURNING *
    `;
    const result = await pool.query(query, [publishDate]);
    return result.rows[0] || null;
  },

  /**
   * Check if newsletter exists for date
   */
  async exists(publishDate) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM daily_newsletters
        WHERE publish_date = $1
      ) as exists
    `;
    const result = await pool.query(query, [publishDate]);
    return result.rows[0].exists;
  },

  /**
   * Get database pool (for advanced queries)
   */
  getPool() {
    return pool;
  },

  /**
   * Get all newsletters
   */
  async getAll() {
    const query = `
      SELECT * FROM daily_newsletters
      ORDER BY publish_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  /**
   * Get newsletters older than a specific date
   */
  async getOlderThan(date) {
    const query = `
      SELECT * FROM daily_newsletters
      WHERE publish_date < $1
      ORDER BY publish_date ASC
    `;
    const result = await pool.query(query, [date]);
    return result.rows;
  },

  /**
   * Delete newsletters older than a specific date
   * Returns the number of deleted records
   */
  async deleteOlderThan(date) {
    const query = `
      DELETE FROM daily_newsletters
      WHERE publish_date < $1
    `;
    const result = await pool.query(query, [date]);
    return { count: result.rowCount };
  },
};

export default Newsletter;
