
## バックエンド学習ガイド (Frontend Developer向け)

このプロジェクトは、フロントエンドエンジニアがバックエンドの基礎を学ぶために設計されています。特に「サーバーレスアーキテクチャ」と「型安全なDB操作」に焦点を当てています。

### 1. サーバーレスアーキテクチャ (Cloudflare Workers)

従来のNode.jsサーバー（Expressなど）とは異なり、Cloudflare Workersは「エッジ」で動作するサーバーレス環境です。

*   **Cloudflare Workersとは？**:
    *   Google Chromeと同じV8エンジン（JavaScriptエンジン）上で動作する、軽量な実行環境です。
    *   **Node.jsではありません**: ファイルシステム(`fs`)などのNode.js固有のAPIが使えません。その代わり、ブラウザ標準の Web Standards API (`fetch`, `Request`, `Response`など) に準拠しています。
    *   **エッジコンピューティング**: 世界中のCloudflareデータセンターでコードが実行されるため、ユーザーに近い場所で処理が行われ、高速です。
*   **`process.env` が使えない理由**: WorkersはNode.jsランタイムではないため、標準の環境変数 `process.env` は存在しません。代わりに `Bindings` (`c.env`) という仕組みを使います。
*   **Dependency Injection (依存性の注入)**: DB接続や環境変数をグローバルに参照するのではなく、リクエストごとのコンテキスト (`c`) から取得して関数に渡す設計パターンを採用しています。これにより、テストが容易になり、環境ごとの切り替えがスムーズになります。

### 2. データベース設計 (Schema Design)

`apps/backend/src/db/schema.ts` に定義されています。

*   **Users (`users`)**: ユーザー情報を管理。
    *   `id`: UUID (一意な識別子)
    *   `email`: ログイン用メールアドレス
    *   `displayName`: 表示名
*   **Body Records (`body_records`)**: 体重・体脂肪率の記録。
    *   `userId`: `users.id` への外部キー (Foreign Key)。これにより「誰の記録か」を紐付けます。
    *   `weight`, `bodyFatPercentage`: `decimal` 型を使用。浮動小数点誤差を防ぐため、金銭や計測値には `decimal` が推奨されます。

### 3. ORM (Drizzle ORM)

SQLを直接書くのではなく、TypeScriptのオブジェクトとしてDBを操作します。

*   **Type Safety**: スキーマ定義から自動的に型が生成されるため、`select` した結果がそのままTypeScriptの型として扱えます。
    *   例: `const user = await db.select().from(users)...` → `user` は `User` 型になる。
*   **Migration**: スキーマを変更した場合、`drizzle-kit` を使ってDB構造を安全に更新します。

### 4. 認証とセキュリティ

*   **Stateless Auth (JWT)**: サーバー側にセッションを持たず、署名付きトークン (JWT) で認証状態を管理します。サーバーレス環境と相性が良い方式です。
*   **Middleware Pattern**: `authMiddleware` を作成し、特定のエンドポイント（記録の作成・閲覧など）の前に挟むことで、認証チェックを共通化しています。

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

## デプロイ設定 (GitHub Secrets)

このプロジェクトは GitHub Actions を使用して Cloudflare (Workers & Pages) に自動デプロイします。
GitHub リポジトリの **Settings > Secrets and variables > Actions** に以下のシークレットを登録してください。

### 必須シークレット一覧

| シークレット名 | 説明 | 取得方法 |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン | Cloudflareダッシュボード > My Profile > API Tokens > Create Token (テンプレート: Edit Cloudflare Workers) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウントID | Cloudflareダッシュボード > Workers & Pages > 右側のサイドバー (Account ID) |
| `DATABASE_URL` | Neon PostgreSQL 接続文字列 | Neonダッシュボード > Connection Details (Pooled connection推奨) |
| `JWT_SECRET` | JWT署名用シークレットキー | 任意のランダムな文字列 (例: `openssl rand -hex 32` で生成) |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | Google Cloud Console > APIs & Services > Credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | Google Cloud Console > APIs & Services > Credentials |
| `VITE_API_BASE` | バックエンドAPIのURL | 初回デプロイ後に確定します (例: `https://body-tracker-backend.<subdomain>.workers.dev`) |

### 初回デプロイの手順

1. `VITE_API_BASE` 以外のシークレットを全て登録します。
2. `main` ブランチにプッシュして、GitHub Actions を実行します。
3. `Deploy Backend` ジョブが成功すると、ログにデプロイ先のURLが表示されます (例: `https://body-tracker-backend.your-name.workers.dev`)。
4. そのURLをコピーし、GitHub Secrets の `VITE_API_BASE` に登録します。
5. 再度 GitHub Actions を実行 (Re-run jobs) すると、フロントエンドが正しいAPI先を知った状態でビルド・デプロイされます。

## ライセンス
学習/個人利用目的。必要に応じて追記予定。
