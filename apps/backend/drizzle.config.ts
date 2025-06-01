import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts', // スキーマファイルの場所
  out: './drizzle', // マイグレーションファイルの出力先
  dialect: 'postgresql', // 'postgresql' or 'mysql' depending on your database
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/body_tracker',
  },
} satisfies Config;
