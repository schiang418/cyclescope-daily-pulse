#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * Creates the daily_newsletters table for storing generated newsletters
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const MIGRATION_SQL = `
-- Create daily_newsletters table
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

-- Create index on publish_date for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_newsletters_publish_date 
  ON daily_newsletters(publish_date DESC);

-- Create index on generation_status for filtering
CREATE INDEX IF NOT EXISTS idx_daily_newsletters_status 
  ON daily_newsletters(generation_status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_daily_newsletters_created_at 
  ON daily_newsletters(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_daily_newsletters_updated_at ON daily_newsletters;
CREATE TRIGGER update_daily_newsletters_updated_at
  BEFORE UPDATE ON daily_newsletters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE daily_newsletters IS 'Stores daily market pulse newsletters with audio';
COMMENT ON COLUMN daily_newsletters.publish_date IS 'Date the newsletter is published (unique)';
COMMENT ON COLUMN daily_newsletters.title IS 'Newsletter headline';
COMMENT ON COLUMN daily_newsletters.hook IS 'Opening paragraph';
COMMENT ON COLUMN daily_newsletters.sections IS 'Array of section objects with title and content';
COMMENT ON COLUMN daily_newsletters.conclusion IS 'Closing paragraph';
COMMENT ON COLUMN daily_newsletters.sources IS 'Array of source URLs from Gemini Search Grounding';
COMMENT ON COLUMN daily_newsletters.audio_url IS 'URL to WAV audio file';
COMMENT ON COLUMN daily_newsletters.audio_duration_seconds IS 'Duration of audio in seconds';
COMMENT ON COLUMN daily_newsletters.generation_status IS 'Status: pending, generating, complete, failed';
COMMENT ON COLUMN daily_newsletters.error_message IS 'Error message if generation failed';
`;

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('railway') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🚀 Running migration...');
    await client.query(MIGRATION_SQL);
    console.log('✅ Migration completed successfully');

    // Verify table was created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'daily_newsletters'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table "daily_newsletters" verified');
      
      // Show table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'daily_newsletters'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📊 Table structure:');
      console.table(columns.rows);
    } else {
      console.error('❌ Table "daily_newsletters" not found after migration');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
migrate();
