import { date, decimal, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// usersテーブル定義（実際のDBに合わせて修正）
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(), 
  username: varchar('username', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  // displayName: varchar('display_name', { length: 100 }), // 削除
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
  recordedDate: date('recorded_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BodyRecord = typeof bodyRecords.$inferSelect;
export type NewBodyRecord = typeof bodyRecords.$inferInsert;
