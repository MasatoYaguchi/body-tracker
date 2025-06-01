import { db, testConnection } from './db/connection';
import { users } from './db/schema';

async function main() {
  console.log('🔍 Testing database connection...');

  // 接続テスト
  await testConnection();

  // データ取得テスト
  console.log('📊 Fetching users...');
  const allUsers = await db.select().from(users);
  console.log('Users found:', allUsers.length);
  console.log('Users:', allUsers);
}

main().catch(console.error);
