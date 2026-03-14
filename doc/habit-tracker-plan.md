# 習慣トラッカーページの追加 - 実装プラン

## 概要

禁煙・禁酒など「継続日数」を記録し、達成度や節約金額を自動計算する汎用習慣トラッカー。

## 機能

| 項目 | 説明 |
|------|------|
| 習慣カテゴリ | ユーザーが自由に追加・編集可能 |
| 開始日 | 習慣を始めた日 |
| 1日あたりの数量 | 例: 1日20本（タバコ）、1日2杯（酒） |
| 1単位あたりの金額 | 例: 1本30円、1杯500円 |

## 自動計算される出力

- **継続時間**: ○日○時間○分（リアルタイム）
- **達成数量**: ○本禁煙、○杯我慢など
- **節約金額**: 数量 × 単価
- **（オプション）延びた寿命**: カテゴリごとに係数設定可能

## UIイメージ

```
┌─────────────────────────────┐
│ 🚭 禁煙                      │
│ 100日 12:31:02              │
│ 3,015本 | 63,315円節約       │
├─────────────────────────────┤
│ 🍺 禁酒                      │
│ 30日 8:15:00                │
│ 60杯 | 30,000円節約          │
├─────────────────────────────┤
│ ＋ 新しい習慣を追加          │
└─────────────────────────────┘
```

---

## DB スキーマ

```typescript
// 習慣カテゴリマスタ（ユーザーが追加・編集可能）
export const habitCategories = pgTable('habit_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 50 }).notNull(),           // 禁煙、禁酒など
  icon: varchar('icon', { length: 10 }),                      // 絵文字
  unitName: varchar('unit_name', { length: 20 }).notNull(),  // 本、杯、回など
  dailyAmount: integer('daily_amount').notNull(),            // 1日あたりの数量
  unitPrice: integer('unit_price').notNull(),                // 1単位あたりの金額（円）
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// 習慣記録（開始日を記録）
export const habitRecords = pgTable('habit_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  categoryId: uuid('category_id').notNull().references(() => habitCategories.id),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),  // 開始日時
  endDate: timestamp('end_date', { withTimezone: true }),                // 終了日時（リセット時）
  isActive: boolean('is_active').default(true),                          // 継続中かどうか
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

---

## 共有型定義

```typescript
export interface HabitCategory {
  id: string;
  name: string;
  icon?: string;
  unitName: string;      // 本、杯、回
  dailyAmount: number;   // 1日あたりの数量
  unitPrice: number;     // 1単位あたりの金額
  sortOrder: number;
}

export interface HabitRecord {
  id: string;
  categoryId: string;
  category?: HabitCategory;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

// 計算結果（フロントエンドで算出）
export interface HabitStats {
  elapsedDays: number;
  elapsedHours: number;
  elapsedMinutes: number;
  totalAmount: number;      // 達成数量
  savedMoney: number;       // 節約金額
}
```

---

## API エンドポイント

**習慣カテゴリ**: `/api/habit-categories`
- `GET` - 一覧取得
- `POST` - 新規作成
- `PUT /:id` - 更新
- `DELETE /:id` - 削除

**習慣記録**: `/api/habits`
- `GET` - アクティブな習慣一覧（計算結果含む）
- `POST` - 新規開始
- `PUT /:id/reset` - リセット（endDateを設定し、新規レコード作成）
- `GET /:id/history` - 過去の記録履歴

---

## フロントエンド構成

**ディレクトリ**: `apps/frontend/src/habits/`

- `HabitsPage.tsx` - メインページ
- `HabitCard.tsx` - 習慣カード（リアルタイム更新）
- `HabitCategoryForm.tsx` - カテゴリ追加・編集フォーム
- `HabitStats.tsx` - 統計表示

**ルーティング**: `/habits`

---

## 修正対象ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `apps/backend/src/db/schema.ts` | habitCategories, habitRecordsテーブル追加 |
| `apps/backend/src/server.ts` | habits, habit-categoriesルート登録 |
| `apps/backend/src/routes/habits.ts` | 新規作成 |
| `apps/backend/src/routes/habit-categories.ts` | 新規作成 |
| `packages/shared/src/types.ts` | HabitCategory, HabitRecord型追加 |
| `apps/frontend/src/App.tsx` | /habitsルート追加 |
| `apps/frontend/src/habits/*.tsx` | 新規作成（4ファイル） |
| `apps/frontend/src/layout/UserHeader.tsx` | ナビ追加 |

---

## 検証方法

1. `pnpm db:generate && pnpm db:migrate` でマイグレーション実行
2. `pnpm dev` で開発サーバー起動
3. ログイン後、ヘッダーから「習慣」ページへ遷移
4. 新しい習慣カテゴリを作成（例: 禁煙、1日20本、1本30円）
5. 習慣を開始し、リアルタイムでカウントが更新されることを確認
6. 節約金額が正しく計算されることを確認
