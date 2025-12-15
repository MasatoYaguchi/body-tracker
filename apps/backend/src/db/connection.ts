import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon PostgreSQL接続
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}
const sql = neon(process.env.DATABASE_URL);

// Drizzle ORM インスタンス作成
export const db = drizzle(sql, { schema });

// 接続テスト関数
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Neon Database connected successfully at:', result[0].now);
    return true;
  } catch (error) {
    console.error('❌ Neon Database connection failed:', error);
    return false;
  }
}

// Neonはサーバーレスなので明示的な接続終了不要
export async function closeConnection() {
  console.log('📝 Neon connection closed (auto-managed)');
}
