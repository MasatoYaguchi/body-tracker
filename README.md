# 体重・体脂肪率管理アプリ

React 19 + Hono + pnpm Workspaces + Tailwind CSSで構築された体重・体脂肪率管理アプリケーション。

## 機能

- 体重・体脂肪率の記録・編集・削除
- 統計情報の表示
- レスポンシブデザイン
- モダンなUI/UX

## セットアップ

```bash
# 依存関係インストール
pnpm install

# 共有パッケージビルド
pnpm build:shared

# 開発サーバー起動
pnpm dev
```

## 技術スタック

- **フロントエンド**: React 19, Vite, Tailwind CSS
- **バックエンド**: Hono, TypeScript
- **パッケージ管理**: pnpm Workspaces
- **型共有**: TypeScript monorepo
