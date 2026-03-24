# CLAUDE.md

このファイルはClaude Codeがプロジェクトを理解するためのガイドです。

## WHY - プロジェクトの目的

体重・体脂肪率を記録し、ランキング機能で仲間と競争しながらダイエットを継続するためのWebアプリ。React 19やCloudflare Workersなど最新技術の学習も兼ねている。

## WHAT - 主要機能

- **認証**: Google OAuth 2.0 (Authorization Code + PKCE) → JWT発行
- **記録管理**: 体重・体脂肪率のCRUD（論理削除）
- **統計**: 最新値、変化量、推移グラフ表示
- **ランキング**: 減量率に基づくスコアランキング（匿名アクセス可）

## HOW - 開発方法

### コマンド

```bash
pnpm install              # 依存関係インストール
pnpm dev                  # フロント(3000) + バック(8787)同時起動
pnpm build:shared         # 共有パッケージビルド（他のビルド前に必要）
pnpm lint                 # Biome + ESLint
pnpm format               # Biomeフォーマット
pnpm type-check           # TypeScript型チェック
pnpm db:migrate           # DBマイグレーション実行
```

### プロジェクト構成

```
apps/
  frontend/     # React 19 + Vite + Tailwind (localhost:3000)
  backend/      # Hono + Cloudflare Workers (localhost:8787)
packages/
  shared/       # 共有型定義・バリデーション
```

### コードスタイル

Biome使用: 2スペース、シングルクォート、セミコロンあり、行幅100文字、トレイリングカンマあり

### 開発時の注意点

- **型共有**: `packages/shared`に定義、変更後は`pnpm build:shared`再実行
- **認証**: PKCE生成→Google認証→JWT発行（30日有効、localStorage保存）
- **DB**: Neon + Drizzle ORM、スキーマは`apps/backend/src/db/schema.ts`
- **削除**: 論理削除（`deletedAt`フィールド）
- **API**: `/api`ベース、認証必要なエンドポイントはBearerトークン必須
- **デプロイ**: mainブランチpushでCloudflare Pages/Workersに自動デプロイ
- **Git操作**: コミット前に必ずステージングしてユーザーの確認を得ること。確認なしでコミットしない
