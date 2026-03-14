# 体重・体脂肪率管理アプリ

React 19 + Hono + PostgreSQL + Drizzle + pnpm Workspaces + Tailwind CSS で構築された学習 & 実用志向の体組成トラッカー。フロントは **Authorization Code + PKCE (Google OAuth)** を使用し、GSI(ID token) 方式は撤廃済み。

## 主な機能

- 体重 / 体脂肪率の記録 CRUD
- 最近の記録一覧 / 基本統計表示
- Google OAuth (PKCE Code Flow)
- JWT による API 保護
- 型共有 (monorepo shared package)
- React 19 新機能活用 (useOptimistic / useTransition / Suspense)
- Biome + strict TS による品質維持

## セットアップ

> デフォルトでは `apps/backend/.env` の `DATABASE_URL` が Neon (マネージドPostgreSQL) を指しており、DockerでPostgresを起動しなくても動作します。ローカルDBを使いたい場合だけ docker-compose を起動してください。

```bash
# 依存関係インストール
pnpm install

# 共有パッケージビルド
pnpm build:shared

# 開発サーバー起動 (フロント:3000, バック:8787)
pnpm dev
```

## プロジェクト構成

```
body-tracker/
├── apps/
│   ├── frontend/          # React 19 + Vite + Tailwind CSS
│   └── backend/           # Hono (Cloudflare Workers)
├── packages/
│   └── shared/            # 共有型定義・バリデーション
├── doc/                   # ドキュメント
└── .github/workflows/     # CI/CD (GitHub Actions)
```

## 開発コマンド

```bash
# 開発
pnpm dev                  # フロント + バック同時起動
pnpm dev:frontend         # フロントエンドのみ
pnpm dev:backend          # バックエンドのみ

# ビルド・品質チェック
pnpm build                # 全パッケージビルド
pnpm lint                 # Biome + ESLint
pnpm format               # Biomeフォーマット
pnpm type-check           # TypeScript型チェック

# データベース (バックエンド)
pnpm db:migrate           # マイグレーション実行
pnpm db:generate          # マイグレーションファイル生成
pnpm db:studio            # Drizzle Studio (DB GUI)
```

## 技術スタック (抜粋)

| Layer | 技術 / ライブラリ |
|-------|--------------------|
| Frontend | React 19, Vite, Tailwind CSS |
| Auth (FE) | OAuth2 Authorization Code + PKCE, custom PKCE util |
| Backend | Hono (Cloudflare Workers), google-auth-library, jsonwebtoken |
| DB | Neon (Serverless PostgreSQL), Drizzle ORM |
| Shared | TypeScript types / validation (@body-tracker/shared) |
| Tooling | pnpm, Biome, TypeScript strict, GitHub Actions |

## ドキュメント

詳細なドキュメントは `doc/` ディレクトリにあります。

- [**バックエンド学習ガイド**](./doc/study.md): Cloudflare Workers, Hono, Drizzle ORM などの技術解説
- [**デプロイ手順**](./doc/deploy.md): GitHub Secrets の設定とデプロイフロー

