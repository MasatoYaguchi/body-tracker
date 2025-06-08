# 体重・体脂肪率管理アプリ 開発環境設定 引き継ぎ資料

## 📋 実施した作業内容

### 1. **コードフォーマット設定の修正と最適化**

#### **問題**: 保存時にコードフォーマットが動作しない
- BiomeがApp.tsxファイルを認識しない
- VS Code設定でPrettierとBiomeが競合

#### **解決策**:
- **Prettier削除**: BiomeとESLintの組み合わせに統一
- **biome.json修正**: ファイル認識パターンの最適化
- **.vscode/settings.json更新**: Biome優先設定に変更

### 2. **Lintエラーの修正**

#### **修正前**: 25個のエラー
#### **修正後**: 5個のエラー → 自動修正で解決

**主な修正内容**:
- TypeScript import文の最適化
- useEffect依存配列の修正
- JSX自己終了タグの修正
- button要素のtype属性追加
- SVGアクセシビリティ属性追加

### 3. **React 18新機能の導入**

#### **導入した新機能**:
- **useId Hook**: フォーム要素の一意ID生成
- **useCallback**: 関数メモ化による最適化
- **Automatic Batching**: 複数state更新の最適化
- **型安全性向上**: TypeScript 5.x + React 18

### 4. **開発環境の最適化**

#### **除外設定の強化**:
- `node_modules`、`.pnpm-store`をLint対象から除外
- VS Codeファイル監視の最適化
- `.biomeignore`ファイルの作成

---

## 🛠️ 現在の設定ファイル

### **biome.json** (主要設定)
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useTemplate": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "all"
    }
  },
  "files": {
    "include": [
      "apps/**/*.{js,jsx,ts,tsx,json,css}",
      "packages/**/*.{js,jsx,ts,tsx,json}",
      "*.{js,jsx,ts,tsx,json}"
    ],
    "ignore": [
      ".pnpm-store",
      ".pnpm-store/**",
      ".pnpm",
      ".pnpm/**",
      "node_modules",
      "node_modules/**",
      "**/node_modules",
      "**/node_modules/**",
      "dist",
      "dist/**",
      "**/dist",
      "**/dist/**",
      "build",
      "build/**",
      "**/build",
      "**/build/**",
      ".next",
      ".next/**",
      "**/.next",
      "**/.next/**",
      ".vite",
      ".vite/**",
      "**/.vite",
      "**/.vite/**",
      "**/*.d.ts",
      "coverage",
      "coverage/**",
      "**/coverage",
      "**/coverage/**",
      ".git",
      ".git/**",
      "**/.git",
      "**/.git/**",
      "pnpm-lock.yaml",
      "**/pnpm-lock.yaml"
    ]
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

### **.vscode/settings.json** (VS Code設定)
```json
{
  // TypeScript設定
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.suggest.includeCompletionsForModuleExports": true,
  
  // フォーマッター設定（Biomeを優先）
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": false,
  "editor.formatOnType": false,
  
  // 保存時のアクション（より明示的に）
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit",
    "source.fixAll": "explicit",
    "quickfix.biome": "explicit"
  },
  
  // ファイルタイプ別フォーマッター設定（より詳細に）
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit",
      "quickfix.biome": "explicit"
    }
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome", 
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit",
      "quickfix.biome": "explicit"
    }
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "quickfix.biome": "explicit"
    }
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "quickfix.biome": "explicit"
    }
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "[jsonc]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  
  // CSS関連（TailwindCSS用）
  "[css]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "[scss]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  
  // TailwindCSS設定
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["className\\s*=\\s*[\"'`]([^\"'`]*)[\"'`]", "([a-zA-Z0-9\\-:]+)"]
  ],
  
  // Emmet設定
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "emmet.triggerExpansionOnTab": true,
  
  // ファイル監視除外設定（パフォーマンス向上）
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.pnpm-store/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.git/**": true,
    "**/coverage/**": true,
    "pnpm-lock.yaml": true
  },
  
  // 検索除外設定
  "search.exclude": {
    "**/node_modules/**": true,
    "**/.pnpm-store/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.git/**": true,
    "**/coverage/**": true,
    "pnpm-lock.yaml": true
  },
  
  // Git設定
  "git.enableSmartCommit": true,
  "git.confirmSync": false,
  
  // その他の便利設定
  "explorer.confirmDelete": false,
  "explorer.confirmDragAndDrop": false,
  "workbench.editor.enablePreview": false,
  "breadcrumbs.enabled": true
}
```

### **.vscode/extensions.json** (推奨拡張機能)
```json
{
  "recommendations": [
    // 必須ツール（BiomeのみでOK）
    "biomejs.biome",
    
    // React & TypeScript
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    
    // 開発支援
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-eslint",
    
    // Git
    "eamodio.gitlens",
    
    // その他便利ツール
    "ms-vscode.vscode-thunder-client",
    "streetsidesoftware.code-spell-checker",
    "usernamehw.errorlens"
  ],
  "unwantedRecommendations": [
    "ms-vscode.vscode-typescript",
    "esbenp.prettier-vscode"
  ]
}
```

### **.biomeignore** (除外ファイル)
```
.pnpm-store
.pnpm-store/**
.pnpm
.pnpm/**
node_modules
node_modules/**
dist
dist/**
build
build/**
coverage
coverage/**
**/*.d.ts
pnpm-lock.yaml
.git
.git/**
```

---

## 🎯 React 18新機能の活用状況

### **App.tsx での実装例**
```tsx
import type { BodyRecord, Stats } from '@body-tracker/shared';
import type React from 'react';
import { useCallback, useEffect, useId, useState } from 'react';

// useId Hook (React 18新機能)
const RecordForm = ({ onSubmit, editingRecord, onCancel }) => {
  const formId = useId(); // 一意なIDを生成
  
  return (
    <form>
      <label htmlFor={`${formId}-weight`}>体重</label>
      <input id={`${formId}-weight`} />
    </form>
  );
};

// useCallback最適化
const App = () => {
  const loadData = useCallback(async () => {
    try {
      // Automatic Batching (React 18で自動適用)
      setLoading(true);
      const [recordsData, statsData] = await Promise.all([
        api.getRecords(), 
        api.getStats()
      ]);
      setRecords(recordsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]); // 依存配列を適切に管理
};
```

---

## 📦 package.json スクリプト

### **利用可能なコマンド**
```bash
# 開発サーバー起動
pnpm dev                # 全体起動（フロント+バック）
pnpm dev:frontend       # フロントエンドのみ
pnpm dev:backend        # バックエンドのみ

# コード品質チェック
pnpm check              # Biomeチェック
pnpm check:fix          # Biome自動修正
pnpm lint               # Lint実行
pnpm lint:fix           # Lint自動修正
pnpm format             # フォーマット実行
pnpm type-check         # TypeScript型チェック

# ビルド
pnpm build              # 全体ビルド
pnpm build:shared       # 共有パッケージビルド
pnpm build:frontend     # フロントエンドビルド
pnpm build:backend      # バックエンドビルド

# クリーンアップ
pnpm clean              # ビルドファイル削除
```

---

## ✅ 動作確認済み機能

### **1. 保存時自動フォーマット**
- ✅ セミコロン自動追加 (`semicolons: "always"`)
- ✅ トレイリングカンマ自動追加 (`trailingCommas: "all"`)
- ✅ インポート文自動整理
- ✅ シングルクォート統一 (`quoteStyle: "single"`)

### **2. Lint自動修正**
- ✅ `pnpm lint:fix`で大部分のエラー自動修正
- ✅ TypeScriptエラーの自動検出
- ✅ アクセシビリティエラーの検出
- ✅ React Hooks依存配列の検証

### **3. VS Code統合**
- ✅ Biome拡張機能連携
- ✅ ファイル保存時の自動フォーマット
- ✅ リアルタイムエラー表示
- ✅ 自動インポート補完

---

## 🔧 推奨VS Code拡張機能

### **必須拡張機能**
- `biomejs.biome` - フォーマッター・リンター
- `ms-vscode.vscode-typescript-next` - TypeScript最新機能
- `bradlc.vscode-tailwindcss` - TailwindCSS補完

### **開発支援**
- `formulahendry.auto-rename-tag` - HTMLタグ自動リネーム
- `christian-kohler.path-intellisense` - パス補完
- `usernamehw.errorlens` - エラー表示強化
- `eamodio.gitlens` - Git履歴可視化

### **削除済み拡張機能**
- ❌ `esbenp.prettier-vscode` - Biomeと競合するため削除

---

## 🚀 次の開発者への推奨事項

### **1. 初回セットアップ手順**
```bash
# 1. プロジェクトクローン・移動
cd /workspaces/body-tracker

# 2. 依存関係インストール
pnpm install

# 3. 共有パッケージビルド
pnpm build:shared

# 4. 開発サーバー起動
pnpm dev

# 5. VS Code拡張機能インストール確認
# （.vscode/extensions.json の推奨拡張機能を確認）
```

### **2. 日常的な開発フロー**
```bash
# 開発開始時
pnpm dev

# コード変更後（保存時に自動実行されるが手動でも可能）
pnpm check      # エラーチェック
pnpm lint:fix   # 自動修正

# コミット前
pnpm build      # ビルド確認
pnpm type-check # 型チェック
```

### **3. バックエンド学習の進め方**
- **小さなタスク**から始める（API1つずつ）
- **Drizzle ORM**の基礎から学習
- **PostgreSQL**のSQL基礎知識習得
- **Hono**のミドルウェア理解

### **4. React 18新機能の活用**
- **useTransition**: 重い処理の低優先度実行
- **useDeferredValue**: 検索フィルタリング最適化  
- **Suspense**: データローディング改善
- **useId**: フォーム要素の一意ID生成（既に実装済み）

---

## 📝 技術スタック

### **フロントエンド**
- **React 19** (RC版) + **TypeScript 5.x**
- **Vite** (開発サーバー)
- **TailwindCSS** (スタイリング)
- **pnpm Workspaces** (モノレポ管理)

### **バックエンド**
- **Hono** (APIフレームワーク)
- **Drizzle ORM** + **PostgreSQL**
- **Docker** + **Docker Compose** (開発環境)

### **開発ツール**
- **Biome** (フォーマッター・リンター)
- **ESLint** (追加Lintルール)
- **TypeScript** (型安全性)
- **VS Code** + **GitHub Codespaces**

---

## 🔍 トラブルシューティング

### **よくある問題と解決方法**

#### **1. 保存時フォーマットが動作しない**
```bash
# VS Code拡張機能確認
code --list-extensions | grep biome

# 拡張機能インストール
code --install-extension biomejs.biome

# VS Code再起動
# Cmd + Shift + P → "Developer: Reload Window"
```

#### **2. node_modulesがLint対象になる**
```bash
# .biomeignore ファイル確認
cat .biomeignore

# 内容が正しくない場合は再作成
echo "node_modules" > .biomeignore
echo ".pnpm-store" >> .biomeignore
```

#### **3. TypeScript型エラー**
```bash
# 共有パッケージの再ビルド
pnpm build:shared

# 型チェック実行
pnpm type-check
```

#### **4. Lintエラーが多数表示される**
```bash
# 自動修正を実行
pnpm lint:fix

# または
pnpm check:fix
```

---

## 🎉 完了状況

- ✅ **保存時自動フォーマット**: 完全動作
- ✅ **Lintエラー**: 25個 → 0個（自動修正機能動作）
- ✅ **React 18新機能**: 基本実装完了
- ✅ **開発環境**: 最適化完了
- ✅ **型安全性**: TypeScript完全対応
- ✅ **VS Code統合**: 推奨拡張機能設定済み
- ✅ **パフォーマンス**: 不要ファイル除外済み

---

## 📅 作業日時・担当者

- **作業実施日**: 2025年6月1日
- **担当者**: フロントエンド専門エンジニア → バックエンド学習予定
- **作業時間**: 約2-3時間

---

## 🚀 今後の開発方針

**開発環境は本格的な機能開発を始められる状態です！**

### **短期目標 (1-2週間)**
- React 18新機能の理解深化
- バックエンドAPI設計の学習
- データベース設計の基礎習得

### **中期目標 (1ヶ月)**
- 認証機能の実装
- CRUD操作の完全実装
- テスト環境の構築

### **長期目標 (3ヶ月)**
- デプロイ環境の構築
- パフォーマンス最適化
- セキュリティ強化

---

*この資料は開発環境設定の引き継ぎ用として作成されました。質問や不明点があれば、設定ファイルの内容を参照するか、コマンド実行結果を確認してください。*