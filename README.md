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

# 開発サーバー起動
pnpm dev
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

