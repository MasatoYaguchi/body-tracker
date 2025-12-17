import { decimal, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// usersテーブル定義（実際のDBに合わせて修正）
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  displayName: varchar('display_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// body_recordsテーブル定義
export const bodyRecords = pgTable('body_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  weight: decimal('weight', { precision: 5, scale: 2 }).notNull(),
  bodyFatPercentage: decimal('body_fat_percentage', {
    precision: 4,
    scale: 2,
  }).notNull(),
  // NOTE: このカラムは 'date' 型から 'timestamp with time zone' 型に移行されました。
  // 既存のレコードの時刻部分は 00:00:00 に設定されますが、これは意図的な動作です。
  recordedDate: timestamp('recorded_date', { withTimezone: true }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BodyRecord = typeof bodyRecords.$inferSelect;
export type NewBodyRecord = typeof bodyRecords.$inferInsert;
