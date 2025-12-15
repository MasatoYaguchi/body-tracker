import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Drizzle ORM インスタンス作成関数
export function createDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

// 接続テスト関数
export async function testConnection(connectionString: string) {
  try {
    const sql = neon(connectionString);
    const result = await sql`SELECT NOW()`;
    console.log('✅ Neon Database connected successfully at:', result[0].now);
    return true;
  } catch (error) {
    console.error('❌ Neon Database connection failed:', error);
    return false;
  }
}
