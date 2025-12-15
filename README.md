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
| Backend | Hono, google-auth-library, jsonwebtoken |
| DB | PostgreSQL, Drizzle ORM |
| Shared | TypeScript types / validation (@body-tracker/shared) |
| Tooling | pnpm, Biome, TypeScript strict |

## 認証フロー (PKCE)

1. ログインボタン → `startPkceLogin` が PKCE verifier/challenge 生成し sessionStorage 保存
2. Google 認可エンドポイントへリダイレクト (code + S256 challenge)
3. Google から `redirect_uri` に code 付与して戻る (`/auth/callback`)
4. フロント `handleAuthCallback` が code + verifier をサーバへ交換リクエスト
5. バックエンドが Google トークン交換 → ID トークン検証 → ユーザー作成/取得 → JWT 発行
6. フロントが JWT + user を `authStorage` (localStorage) に保存し状態確立

### エラー設計
`auth/domain/result.ts` に Result + AuthDomainError を定義。フロー関数は例外 throw ではなく `Result` を返す。

| Code | 意味 |
|------|------|
| CODE_MISSING | 認可コード欠如 |
| STATE_MISMATCH | state 不一致 |
| PKCE_VERIFIER_MISSING | verifier が失われた (再ログイン必要) |
| CODE_EXCHANGE_FAILED | 交換 API 失敗 |

## ディレクトリ (抜粋: frontend auth)

```
apps/frontend/src/auth/
	domain/result.ts          # Result とドメインエラー
	utils/pkce.ts             # PKCE 生成ユーティリティ
	services/authCodeFlow.ts  # アプリ層: フロー調停
	services/authApi.ts       # バックエンド呼び出し
	services/authStorage.ts   # ローカルストレージ管理
	hooks/useAuthState.ts     # 状態管理 (useOptimistic 他)
	providers/AuthProvider.tsx
	components/AuthCallback.tsx
```

## 開発コマンド (再掲)

```bash
# 依存 & 全体開発
pnpm install
pnpm dev          # frontend + backend 並行

# 型 & Lint
pnpm type-check
pnpm check:fix

# 共有パッケージ → 全体ビルド
pnpm build:shared && pnpm build
```

### データベース切り替えメモ
- そのまま動かす: `apps/backend/.env` の Neon 接続文字列を使うので Docker 不要
- ローカルで動かす: `DATABASE_URL=postgresql://developer:password123@localhost:5432/body_tracker` に変更し、`docker compose up -d postgres` を実行

## 今後の拡張アイデア

- Vitest 導入と PKCE/Result の単体テスト
- Refresh Token / Token rotation
- 集計の高速化 (マテリアライズドビュー or キャッシュ)
- グラフ表示 (チャートライブラリ統合)
- 国際化 (i18n)

## ライセンス
学習/個人利用目的。必要に応じて追記予定。
