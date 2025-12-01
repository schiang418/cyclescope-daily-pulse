#!/usr/bin/env node

/**
 * Direct Database Migration (bypasses SSL issues)
 */

import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:maYQxlEnfbHDnTWShYoDEEhmMqTYkLaC@hopper.proxy.rlwy.net:38534/railway';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS daily_newsletters (
  id SERIAL PRIMARY KEY,
  publish_date DATE NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  hook TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  conclusion TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  audio_url VARCHAR(1000),
  audio_duration_seconds INTEGER,
  generation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_newsletters_publish_date 
  ON daily_newsletters(publish_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_newsletters_status 
  ON daily_newsletters(generation_status);

CREATE INDEX IF NOT EXISTS idx_daily_newsletters_created_at 
  ON daily_newsletters(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_daily_newsletters_updated_at ON daily_newsletters;
CREATE TRIGGER update_daily_newsletters_updated_at
  BEFORE UPDATE ON daily_newsletters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

async function migrate() {
  // Try different SSL configurations
  const sslConfigs = [
    { rejectUnauthorized: false },
    { rejectUnauthorized: false, checkServerIdentity: () => undefined },
    undefined,
  ];

  for (let i = 0; i < sslConfigs.length; i++) {
    const sslConfig = sslConfigs[i];
    console.log(`\n🔄 Attempt ${i + 1}/${sslConfigs.length} with SSL config:`, sslConfig || 'no SSL');

    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: sslConfig,
    });

    try {
      console.log('🔌 Connecting to database...');
      await client.connect();
      console.log('✅ Connected successfully!');

      console.log('🚀 Running migration...');
      await client.query(MIGRATION_SQL);
      console.log('✅ Migration completed successfully');

      // Verify
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'daily_newsletters'
      `);

      if (result.rows.length > 0) {
        console.log('✅ Table "daily_newsletters" verified');
        
        const columns = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = 'daily_newsletters'
          ORDER BY ordinal_position
        `);
        
        console.log('\n📊 Table structure:');
        console.table(columns.rows);
      }

      await client.end();
      console.log('✅ Migration successful!');
      process.exit(0);

    } catch (error) {
      console.error(`❌ Attempt ${i + 1} failed:`, error.message);
      try {
        await client.end();
      } catch (e) {
        // Ignore
      }
      
      if (i === sslConfigs.length - 1) {
        console.error('\n❌ All attempts failed');
        process.exit(1);
      }
    }
  }
}

migrate();
