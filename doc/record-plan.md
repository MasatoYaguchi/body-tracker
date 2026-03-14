# ダイエット活動記録ページの追加 - 実装プラン

## 概要

体重・体脂肪率の記録に加え、**日々のダイエット活動（運動・食事・生活習慣）を記録するページ**を追加する。

## 記録項目（総合版）

| カテゴリ | 項目 | 入力形式 | 備考 |
|----------|------|----------|------|
| **基本** | 日付 | date picker | 必須 |
| **運動** | 運動した？ | Yes/No トグル | |
| | 運動種目 | セレクト + その他入力 | ユーザーが追加・編集可能 |
| | 時間（分） | 数値入力 | |
| **食事** | 食事評価 | 5段階 | 抑えた〜食べすぎ |
| | 間食した？ | Yes/No トグル | |
| **生活** | 飲酒した？ | Yes/No トグル | |
| **メモ** | 自由記述 | テキストエリア | 任意 |

※睡眠時間は別アプリで自動収集のため除外

## 出力

- **相関グラフ**: 体重推移と活動データを重ねて表示（運動した日/していない日の比較など）
- **最近の記録リスト**: 直近の活動記録一覧

---

## 実装ステップ

### 1. DB スキーマ追加
**ファイル**: `apps/backend/src/db/schema.ts`

```typescript
// 運動種目マスタ（ユーザーが追加・編集可能）
export const exerciseTypes = pgTable('exercise_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 50 }).notNull(),        // ウォーキング、ランニング等
  sortOrder: integer('sort_order').default(0),            // 表示順
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// 活動記録
export const activityRecords = pgTable('activity_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  recordedDate: timestamp('recorded_date', { withTimezone: true }).notNull(),

  // 運動
  didExercise: boolean('did_exercise').default(false),
  exerciseTypeId: uuid('exercise_type_id').references(() => exerciseTypes.id),
  exerciseMinutes: integer('exercise_minutes'),

  // 食事
  mealRating: integer('meal_rating'),  // 1-5
  hadSnack: boolean('had_snack').default(false),

  // 生活
  hadAlcohol: boolean('had_alcohol').default(false),

  // メモ
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
```

### 2. 共有型定義追加
**ファイル**: `packages/shared/src/types.ts`

```typescript
// 運動種目マスタ
export interface ExerciseType {
  id: string;
  name: string;
  sortOrder: number;
}

// 活動記録
export interface ActivityRecord {
  id: string;
  date: string;
  didExercise: boolean;
  exerciseTypeId?: string;
  exerciseType?: ExerciseType;  // JOIN結果
  exerciseMinutes?: number;
  mealRating?: number;
  hadSnack: boolean;
  hadAlcohol: boolean;
  notes?: string;
  createdAt: string;
}

export interface CreateActivityRecordRequest {
  date: string;
  didExercise: boolean;
  exerciseTypeId?: string;
  exerciseMinutes?: number;
  mealRating?: number;
  hadSnack: boolean;
  hadAlcohol: boolean;
  notes?: string;
}

export interface CreateExerciseTypeRequest {
  name: string;
  sortOrder?: number;
}
```

### 3. バックエンド API 追加

**ファイル**: `apps/backend/src/routes/activities.ts`（新規）

活動記録:
- `GET /api/activities` - 一覧取得
- `POST /api/activities` - 新規作成
- `PUT /api/activities/:id` - 更新
- `DELETE /api/activities/:id` - 削除（論理削除）
- `GET /api/activities/correlation` - 体重との相関データ

**ファイル**: `apps/backend/src/routes/exercise-types.ts`（新規）

運動種目マスタ:
- `GET /api/exercise-types` - 一覧取得
- `POST /api/exercise-types` - 新規作成
- `PUT /api/exercise-types/:id` - 更新
- `DELETE /api/exercise-types/:id` - 削除（論理削除）

※初回アクセス時にデフォルト種目（ウォーキング/ランニング/筋トレ/ストレッチ）を自動作成

### 4. フロントエンド ルーティング追加
**ファイル**: `apps/frontend/src/App.tsx`

```typescript
<Route path="/activities" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
```

### 5. フロントエンド コンポーネント作成
**ディレクトリ**: `apps/frontend/src/activities/`

- `ActivitiesPage.tsx` - メインページ
- `ActivityForm.tsx` - 入力フォーム
- `ActivityList.tsx` - 記録一覧
- `CorrelationChart.tsx` - 相関グラフ（体重 × 活動）
- `ExerciseTypeManager.tsx` - 運動種目の追加・編集UI

### 6. ナビゲーション追加
**ファイル**: `apps/frontend/src/layout/UserHeader.tsx`

ヘッダーに「活動記録」タブ/リンクを追加

---

## 修正対象ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `apps/backend/src/db/schema.ts` | exerciseTypes, activityRecordsテーブル追加 |
| `apps/backend/src/server.ts` | activities, exercise-typesルート登録 |
| `apps/backend/src/routes/activities.ts` | 新規作成 |
| `apps/backend/src/routes/exercise-types.ts` | 新規作成 |
| `packages/shared/src/types.ts` | ExerciseType, ActivityRecord型追加 |
| `apps/frontend/src/App.tsx` | /activitiesルート追加 |
| `apps/frontend/src/activities/*.tsx` | 新規作成（5ファイル） |
| `apps/frontend/src/layout/UserHeader.tsx` | ナビ追加 |

---

## 検証方法

1. `pnpm db:generate && pnpm db:migrate` でマイグレーション実行
2. `pnpm dev` で開発サーバー起動
3. ログイン後、ヘッダーから「活動記録」ページへ遷移
4. 活動を記録し、一覧に表示されることを確認
5. 相関グラフに体重と活動データが表示されることを確認
