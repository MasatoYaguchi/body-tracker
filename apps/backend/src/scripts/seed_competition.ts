import path from 'node:path';
import { config } from 'dotenv';
import { createDb } from '../db/connection';
import { competitions } from '../db/schema';

// Load environment variables
config({ path: path.resolve(__dirname, '../../.dev.vars') }); // Try .dev.vars for wrangler
config(); // Try default .env

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

const db = createDb(DATABASE_URL);

async function seed() {
  console.log('Seeding competition data...');

  await db.insert(competitions).values({
    name: '2025年ボディメイクチャレンジ',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-12-31T23:59:59'),
    isActive: true,
  });

  console.log('Done.');
}

seed().catch(console.error);
