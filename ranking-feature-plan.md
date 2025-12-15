# 体重・体脂肪率減少率ランキング機能 実装計画

**作成日**: 2025年12月14日  
**プロジェクト**: Body Tracker  
**機能概要**: 体重減少率 + 体脂肪率減少率の合計でランキング表示

---

## 1. 機能要件

### 1.1 コア機能
- **ランキング計算ロジック**:
  - 各参加者の体重減少率(%) + 体脂肪率減少率(%) を算出
  - 合計値でランキングを作成
  - 例: 体重5%減 + 体脂肪率3%減 = 合計8%

### 1.2 計算式
```
体重減少率(%) = ((開始時体重 - 最新体重) / 開始時体重) × 100
体脂肪率減少率(%) = ((開始時体脂肪率 - 最新体脂肪率) / 開始時体脂肪率) × 100
総合スコア(%) = 体重減少率 + 体脂肪率減少率
```

### 1.3 対象期間
- **期間の定義**: 競技開始日から現在（または終了日）まで
- **基準データ**: 開始日に最も近いbodyRecordを基準値として使用
- **最新データ**: 各ユーザーの最新のbodyRecordを比較対象とする

### 1.4 参加者管理
- 競技に参加するユーザーのIDリストを別途管理
- 初期フェーズではダミーデータを使用してテスト

---

## 2. データベース設計

### 2.1 新規テーブル: `ranking_participants`（参加者管理）
- **変更点**: `competitions`テーブルは廃止（期間などは定数管理）。`competition_participants`をシンプル化。

```typescript
export const rankingParticipants = pgTable('ranking_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id)
    .unique(), // 1ユーザー1回のみ参加
  // 基準値（開始時の値）
  baselineWeight: decimal('baseline_weight', { precision: 5, scale: 2 }).notNull(),
  baselineBodyFat: decimal('baseline_body_fat', { precision: 4, scale: 2 }).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

### 2.2 期間設定（ハードコーディング）
- DBではなくアプリケーションコード（定数）で管理
```typescript
export const CURRENT_COMPETITION = {
  name: '2025年冬の健康チャレンジ',
  startDate: new Date('2025-01-01T00:00:00Z'),
  endDate: new Date('2025-03-31T23:59:59Z'),
};
```

### 2.3 既存テーブル活用
- **`bodyRecords`**: 既存のまま使用
- 競技期間中のレコードをフィルタリングして最新値を取得

---

## 3. バックエンドAPI設計

### 3.1 エンドポイント一覧

#### **POST `/api/ranking/join`**
- ランキングへの参加登録
- リクエスト: `{ userId }` (認証ユーザーから取得推奨)
- 処理:
  1. ユーザーの最新bodyRecordを取得
  2. `ranking_participants`にbaselineWeight/bodyFatとして保存

#### **GET `/api/ranking/participants`**
- 参加者一覧取得

#### **GET `/api/ranking`**
- **メインエンドポイント**: ランキング取得
- レスポンス例:
```typescript
{
  competitionName: string;
  startDate: string;
  endDate: string | null;
  rankings: [
    {
      rank: 1,
      userId: string,
      username: string,
      baselineWeight: 75.5,
      currentWeight: 71.2,
      weightLossRate: 5.7, // %
      baselineBodyFat: 22.0,
      currentBodyFat: 19.5,
      bodyFatLossRate: 11.4, // %
      totalScore: 17.1, // %
      recordedAt: "2025-12-14T10:00:00Z"
    },
    // ...
  ]
}
```

#### **計算ロジック（バックエンド）**
```typescript
// 疑似コード
async function calculateRanking() {
  // 1. 参加者一覧を取得（baseline値含む）
  const participants = await getParticipants();
  
  const rankings = await Promise.all(participants.map(async (p) => {
    // 2. 各参加者の最新bodyRecordを取得
    const latestRecord = await getLatestBodyRecord(p.userId, CURRENT_COMPETITION.startDate);
    
    // 3. 減少率計算
    const weightLossRate = ((p.baselineWeight - latestRecord.weight) / p.baselineWeight) * 100;
    const bodyFatLossRate = ((p.baselineBodyFat - latestRecord.bodyFatPercentage) / p.baselineBodyFat) * 100;
    const totalScore = weightLossRate + bodyFatLossRate;
    
    return {
      userId: p.userId,
      username: p.user.username,
      baselineWeight: p.baselineWeight,
      currentWeight: latestRecord.weight,
      weightLossRate,
      baselineBodyFat: p.baselineBodyFat,
      currentBodyFat: latestRecord.bodyFatPercentage,
      bodyFatLossRate,
      totalScore,
      recordedAt: latestRecord.recordedAt
    };
  }));
  
  // 4. totalScoreでソート（降順）
  rankings.sort((a, b) => b.totalScore - a.totalScore);
  
  // 5. ランク付け
  rankings.forEach((r, idx) => r.rank = idx + 1);
  
  return rankings;
}
```

---

## 4. フロントエンド設計

### 4.1 新規コンポーネント構成
```
src/
  ranking/
    RankingPage.tsx           # メインページ
    RankingTable.tsx          # ランキング表示テーブル
    RankingCard.tsx           # 個別ランキングカード（モバイル用）
    CompetitionSelector.tsx   # 競技選択ドロップダウン
    ParticipantProgress.tsx   # 個人の進捗詳細
```

### 4.2 RankingTable 表示項目
| 順位 | ユーザー名 | 開始体重 | 現在体重 | 体重減少率 | 開始体脂肪率 | 現在体脂肪率 | 体脂肪率減少率 | **総合スコア** |
|------|------------|----------|----------|------------|--------------|--------------|----------------|----------------|
| 1    | Aさん      | 75.5kg   | 71.2kg   | 5.7%       | 22.0%        | 19.5%        | 11.4%          | **17.1%** 🏆   |
| 2    | Bさん      | 68.0kg   | 65.1kg   | 4.3%       | 25.0%        | 22.0%        | 12.0%          | **16.3%** 🥈   |

### 4.3 UI/UX考慮点
- **リアルタイム性**: データ更新時に自動で再計算
- **色分け**: 上位3位にメダル表示 (🏆🥈🥉)
- **グラフ**: 個人の進捗を折れ線グラフで表示
- **フィルタ**: 期間選択、参加者検索機能

---

## 5. 実装フェーズ計画

### Phase 1: データ基盤構築（1-2日）
- [ ] DBスキーマ作成 (`competitions`, `competition_participants`)
- [ ] Drizzle ORMマイグレーション実行
- [ ] `packages/shared` に型定義追加

### Phase 2: バックエンドAPI実装（2-3日）
- [ ] 競技CRUD操作エンドポイント実装
- [ ] 参加者登録/一覧取得API実装
- [ ] **ランキング計算エンドポイント実装** ⭐
- [ ] ダミーデータ生成スクリプト作成

### Phase 3: フロントエンド実装（2-3日）
- [ ] ランキングページ基本レイアウト
- [ ] ランキングテーブルコンポーネント
- [ ] API連携とデータフェッチング
- [ ] ローディング/エラーハンドリング

### Phase 4: UI/UX改善（1-2日）
- [ ] レスポンシブデザイン対応
- [ ] アニメーション追加
- [ ] グラフ可視化（Chart.js or Recharts）
- [ ] ダークモード対応

### Phase 5: テスト・デバッグ（1日）
- [ ] ダミーデータでの動作確認
- [ ] エッジケース対応（データなし、マイナス値など）
- [ ] パフォーマンステスト

---

## 6. ダミーデータ戦略

### 6.1 初期セットアップ用SQLスクリプト
```sql
-- ダミーユーザー（3名）
INSERT INTO users (id, username, email)
VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'user_a', 'a@example.com'),
  ('550e8400-e29b-41d4-a716-446655440012', 'user_b', 'b@example.com'),
  ('550e8400-e29b-41d4-a716-446655440013', 'user_c', 'c@example.com');

-- 参加者登録（baseline値設定）
INSERT INTO ranking_participants (user_id, baseline_weight, baseline_body_fat)
VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 75.5, 22.0),
  ('550e8400-e29b-41d4-a716-446655440012', 68.0, 25.0),
  ('550e8400-e29b-41d4-a716-446655440013', 82.3, 28.5);

-- body_recordsにダミー記録追加（各ユーザー複数件）
INSERT INTO body_records (user_id, weight, body_fat_percentage, recorded_date)
VALUES
  -- user_a の進捗
  ('550e8400-e29b-41d4-a716-446655440011', 75.5, 22.0, '2025-01-01'),
  ('550e8400-e29b-41d4-a716-446655440011', 74.2, 21.2, '2025-01-15'),
  ('550e8400-e29b-41d4-a716-446655440011', 71.2, 19.5, '2025-02-01'),
  -- user_b の進捗
  ('550e8400-e29b-41d4-a716-446655440012', 68.0, 25.0, '2025-01-01'),
  ('550e8400-e29b-41d4-a716-446655440012', 66.5, 23.5, '2025-01-15'),
  ('550e8400-e29b-41d4-a716-446655440012', 65.1, 22.0, '2025-02-01'),
  -- user_c の進捗
  ('550e8400-e29b-41d4-a716-446655440013', 82.3, 28.5, '2025-01-01'),
  ('550e8400-e29b-41d4-a716-446655440013', 80.5, 27.8, '2025-01-15'),
  ('550e8400-e29b-41d4-a716-446655440013', 78.1, 26.2, '2025-02-01');
```

### 6.2 期待されるランキング結果（テストケース）
| 順位 | ユーザー | 体重減少率 | 体脂肪率減少率 | 総合スコア |
|------|----------|------------|----------------|------------|
| 1    | user_a   | 5.7%       | 11.4%          | 17.1%      |
| 2    | user_b   | 4.3%       | 12.0%          | 16.3%      |
| 3    | user_c   | 5.1%       | 8.1%           | 13.2%      |

---

## 7. 技術スタック確認

### 既存アーキテクチャ活用
- **Backend**: Hono + Drizzle ORM + PostgreSQL（既存構成をそのまま使用）
- **Frontend**: React 19 + Vite + Tailwind CSS
- **共有型**: `packages/shared` で型安全性を保証

### 追加検討ライブラリ
- **グラフ描画**: Recharts または Chart.js（軽量でReact 19対応）
- **日付処理**: date-fns（既にプロジェクトで使用されている可能性）

---

## 8. セキュリティ・バリデーション

### 8.1 入力バリデーション
- 体重・体脂肪率の範囲チェック（現実的な値のみ許可）
- 日付の妥当性チェック（未来日付の禁止）

### 8.2 権限管理
- **参加者**: 自分のデータのみ登録・閲覧可能
- **競技作成**: 管理者のみ（将来的に実装）

---

## 9. 今後の拡張可能性

### 短期（次フェーズ）
- 競技への招待機能
- 個人の日別進捗グラフ
- 目標値設定機能

### 中長期
- チーム対抗戦モード
- SNSシェア機能
- 通知機能（ランキング変動時）
- AIによる健康アドバイス

---

## 10. 実装開始チェックリスト

- [x] プラン作成
- [ ] DBスキーマ設計レビュー
- [ ] ダミーデータSQLスクリプト準備
- [ ] バックエンドエンドポイント仕様確定
- [ ] フロントエンドコンポーネント設計レビュー
- [ ] Phase 1着手準備完了

---

## 付録: 参考計算例

### ケーススタディ: user_a
- **開始**: 体重 75.5kg、体脂肪率 22.0%
- **現在**: 体重 71.2kg、体脂肪率 19.5%

**計算**:
```
体重減少率 = (75.5 - 71.2) / 75.5 × 100 = 5.695... ≈ 5.7%
体脂肪率減少率 = (22.0 - 19.5) / 22.0 × 100 = 11.363... ≈ 11.4%
総合スコア = 5.7 + 11.4 = 17.1%
```

---

**次のアクション**: Phase 1（データベーススキーマ実装）の承認待ち
