# デプロイ設定 (GitHub Secrets)

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
