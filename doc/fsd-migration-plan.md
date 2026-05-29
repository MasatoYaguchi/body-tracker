# Feature-Sliced Design (FSD) 移行計画

## 概要

現在のディレクトリ構造をFeature-Sliced Designに基づいてリファクタリングする計画。
コンポーネントの責務を明確化し、再利用性と保守性を向上させる。

## 現在の構造

```
apps/frontend/src/
├── activities/        # 活動記録機能
├── auth/              # 認証機能
├── dashboard/         # ダッシュボード機能
├── hooks/             # カスタムフック
├── layout/            # レイアウト（UserHeader等）
├── ranking/           # ランキング機能
├── records/           # 体重記録機能
└── ui/                # 共通UIコンポーネント
```

## FSD構造（移行後）

```
apps/frontend/src/
├── app/               # アプリ初期化、プロバイダー、グローバル設定
│   ├── providers/     # Context providers
│   ├── routes/        # ルーティング定義
│   └── styles/        # グローバルスタイル
│
├── pages/             # ページコンポーネント（ルーティング対応）
│   ├── dashboard/
│   ├── activities/
│   ├── records/
│   ├── ranking/
│   └── auth/
│
├── widgets/           # 複合UIブロック（独立した機能を持つ大きなコンポーネント）
│   ├── header/        # サイトヘッダー
│   ├── sidebar/       # サイドバー（将来）
│   └── charts/        # チャートウィジェット
│
├── features/          # ユーザーアクション・ビジネスロジック
│   ├── auth/          # ログイン/ログアウト
│   ├── record-entry/  # 体重記録入力
│   ├── activity-entry/  # 活動記録入力
│   └── ranking-view/  # ランキング表示
│
├── entities/          # ビジネスエンティティ（データモデル）
│   ├── user/          # ユーザー
│   ├── record/        # 体重記録
│   ├── activity/      # 活動記録
│   └── exercise-type/ # 運動種目
│
└── shared/            # 共通リソース
    ├── ui/            # 汎用UIコンポーネント
    │   ├── Button/
    │   ├── Modal/
    │   ├── Card/
    │   ├── Badge/
    │   ├── Input/
    │   ├── LoadingSpinner/
    │   └── ErrorDisplay/
    ├── lib/           # ユーティリティ、ヘルパー
    │   ├── hooks/     # カスタムフック
    │   ├── utils/     # ユーティリティ関数
    │   └── api/       # API クライアント
    └── config/        # 設定、定数
```

## 各レイヤーの責務

| レイヤー | 責務 | 例 |
|----------|------|-----|
| **app** | アプリ初期化、ルーティング、グローバル状態 | App.tsx, providers |
| **pages** | ページ構成、レイアウト組み立て | DashboardPage, ActivitiesPage |
| **widgets** | 独立した複合UI、複数のfeaturesを組み合わせ | Header, StatsChart |
| **features** | ユーザーアクション、ビジネスロジック | RecordForm, ActivityForm |
| **entities** | ドメインモデル、データ表示 | RecordCard, ActivityItem |
| **shared** | 汎用コンポーネント、ユーティリティ | Button, Modal, useModal |

## 依存関係ルール

```
app → pages → widgets → features → entities → shared
              ↓          ↓           ↓          ↓
           shared     shared      shared     (なし)
```

- 上位レイヤーは下位レイヤーにのみ依存可能
- 同一レイヤー内のモジュール間は依存禁止
- `shared` はどのレイヤーからも参照可能

## 移行ステップ

### Phase 1: shared層の整備（優先）

1. **shared/ui の整備**
   - 既存の `ui/` を `shared/ui/` に移動
   - 各コンポーネントをディレクトリ化（index.ts + コンポーネント + stories）
   - Buttonコンポーネント新規作成

2. **shared/lib の整備**
   - `hooks/` を `shared/lib/hooks/` に移動
   - API クライアントを `shared/lib/api/` に集約

### Phase 2: entities層の作成

1. **entities/record** - 体重記録エンティティ
   - 型定義
   - RecordCard コンポーネント

2. **entities/activity** - 活動記録エンティティ
   - 型定義
   - ActivityItem コンポーネント

### Phase 3: features層の分離

1. **features/auth** - 認証フロー
2. **features/record-entry** - 記録入力フォーム
3. **features/activity-entry** - 活動入力フォーム

### Phase 4: widgets層の作成

1. **widgets/header** - UserHeader分割
2. **widgets/charts** - チャートウィジェット

### Phase 5: pages/app層の再構成

1. ページコンポーネントをwidgets/features/entitiesの組み合わせに
2. ルーティング設定の整理

## ファイル構造の例

### shared/ui/Button/

```
shared/ui/Button/
├── index.ts           # re-export
├── Button.tsx         # コンポーネント
├── Button.stories.tsx # Storybook
└── Button.module.css  # スタイル（必要に応じて）
```

### features/record-entry/

```
features/record-entry/
├── index.ts
├── ui/
│   └── RecordForm.tsx
├── model/
│   └── useRecordForm.ts  # フォームロジック
└── api/
    └── recordApi.ts      # API呼び出し
```

## 注意事項

- 一度に全て移行せず、段階的に進める
- 既存の機能を壊さないよう、テストを追加しながら進める
- 移行中はimportパスのエイリアス設定を活用
- Storybookで各コンポーネントの動作確認

## 参考リンク

- [Feature-Sliced Design 公式](https://feature-sliced.design/)
- [FSD Examples](https://github.com/feature-sliced/examples)
