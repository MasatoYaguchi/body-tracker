import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// PostgreSQL接続プール作成
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Drizzle ORM インスタンス作成
export const db = drizzle(pool, { schema });

// 接続テスト関数
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// 接続終了
export async function closeConnection() {
  await pool.end();
}
