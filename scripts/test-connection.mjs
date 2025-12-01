/**
 * Test database connection
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function testConnection() {
  console.log('🔌 Testing database connection...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('\n⏳ Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connection successful!');

    console.log('\n📊 Testing query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].pg_version.split(',')[0]);

    console.log('\n📋 Checking daily_newsletters table...');
    const tableCheck = await client.query(`
      SELECT COUNT(*) as count FROM daily_newsletters
    `);
    console.log('✅ Table exists!');
    console.log('Current row count:', tableCheck.rows[0].count);

    client.release();
    await pool.end();

    console.log('\n🎉 All connection tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\nFull error:', error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
