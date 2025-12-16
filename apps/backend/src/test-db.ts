import 'dotenv/config';
import { createDb, testConnection } from './db/connection';
import { users } from './db/schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const db = createDb(connectionString);

async function main(connStr: string) {
  console.log('🔍 Testing database connection...');

  // 接続テスト
  await testConnection(connStr);

  // データ取得テスト
  console.log('📊 Fetching users...');
  const allUsers = await db.select().from(users);
  console.log('Users found:', allUsers.length);
  console.log('Users:', allUsers);
}

main(connectionString).catch(console.error);
