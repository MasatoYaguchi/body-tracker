import path from 'node:path';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
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
  try {
    console.log('Seeding competition data...');

    const competitionName = '2025年ボディメイクチャレンジ';

    const existing = await db
      .select()
      .from(competitions)
      .where(eq(competitions.name, competitionName))
      .limit(1);

    if (existing.length > 0) {
      console.log('Competition already exists. Skipping...');
      return;
    }

    await db.insert(competitions).values({
      name: competitionName,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-12-31T23:59:59'),
      isActive: true,
    });

    console.log('Competition created.');
  } catch (error) {
    console.error('Error seeding competition:', error);
    process.exit(1);
  } finally {
    console.log('Done.');
    process.exit(0);
  }
}

seed();
