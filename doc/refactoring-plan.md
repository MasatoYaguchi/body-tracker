# UI/コード一貫性リファクタリング計画

## 概要

現在のコードベースにはUI/コードの一貫性に関する問題が多数存在します。本ドキュメントでは、一般的なベストプラクティスに基づいたリファクタリング計画を提案します。

---

## 現状の問題点

### 1. ボタンスタイルの分散

| ファイル | スタイル例 | 問題点 |
|---------|----------|-------|
| UserHeader.tsx | `bg-indigo-600 hover:bg-indigo-700` | hardcodedカラー |
| Dashboard.tsx | `bg-red-600 rounded-md shadow-sm` | サイズ不統一 |
| ActivityForm.tsx | `bg-green-600 rounded-lg transition-colors` | 異なるrounding |
| LoginScreen.tsx | `bg-blue-600 py-3 rounded-md shadow` | 異なるpadding |

### 2. ヘッダー実装の不統一

- **UserHeader.tsx**: 316行の多機能コンポーネント（ナビ、ドロップダウン、ログアウト）
- **DashboardHeader.tsx**: グラデーション背景の独立コンポーネント
- 各ページのヘッダー部分も独自実装

### 3. モーダル背景色の不統一

```tsx
// Modal.tsx
bg-gray-500 bg-opacity-75

// ConfirmModal.tsx
bg-black/50
```

### 4. カスタムカラーの混在

```tsx
// Tailwind設定にprimaryを定義しているが...
primary-600  // 一部で使用
indigo-600   // 別の場所で使用
blue-600     // また別の場所で使用
```

### 5. 型定義・命名規則の不統一

- `export interface` vs `interface` の使い分けなし
- イベントハンドラー: `handle*` vs `on*` vs シンプル動詞
- 関数コンポーネントの戻り値型の明記がない場合あり

---

## リファクタリング計画

### Phase 1: 共通UIコンポーネント基盤の整備（優先度: 高）

#### 1.1 Buttonコンポーネントの作成

**新規ファイル**: `apps/frontend/src/ui/Button.tsx`

```tsx
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// 各variantのスタイル定義
const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'hover:bg-gray-100 text-gray-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};
```

**修正対象ファイル**:
- UserHeader.tsx
- Dashboard.tsx
- RecordForm.tsx
- ActivityForm.tsx
- LoginScreen.tsx
- ConfirmModal.tsx

#### 1.2 Inputコンポーネントの作成

**新規ファイル**: `apps/frontend/src/ui/Input.tsx`

```tsx
export interface InputProps {
  label?: string;
  error?: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'password';
  // ... HTML input属性
}
```

#### 1.3 Cardコンポーネントの作成

**新規ファイル**: `apps/frontend/src/ui/Card.tsx`

```tsx
export interface CardProps {
  variant?: 'default' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// CSSクラス "card" をコンポーネント化
```

#### 1.4 Badgeコンポーネントの作成

**新規ファイル**: `apps/frontend/src/ui/Badge.tsx`

```tsx
export interface BadgeProps {
  variant?: 'blue' | 'green' | 'orange' | 'purple' | 'gray' | 'red';
  children: React.ReactNode;
}
```

**対象**: ActivityList.tsx のタグ表示

---

### Phase 2: ページヘッダーの統一（優先度: 高）

#### 2.1 PageHeaderコンポーネントの作成

**新規ファイル**: `apps/frontend/src/ui/PageHeader.tsx`

```tsx
export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'gradient';
  gradientColors?: string; // e.g., 'from-green-50 to-emerald-50'
}
```

#### 2.2 各ページのヘッダー統一

| ページ | 現状 | 変更後 |
|-------|-----|-------|
| Dashboard | DashboardHeader.tsx | `<PageHeader variant="gradient" />` |
| Activities | inline実装 | `<PageHeader variant="gradient" />` |
| Records | なし | `<PageHeader />` |
| Ranking | inline実装 | `<PageHeader />` |

#### 2.3 UserHeaderのリファクタリング

**現状**: 316行の肥大化したコンポーネント

**分割案**:
```
UserHeader.tsx (50行)
├── NavigationLinks.tsx (ナビゲーションリンク)
├── UserDropdown.tsx (ユーザーメニュー)
└── MobileMenu.tsx (モバイルメニュー)
```

---

### Phase 3: モーダル統一（優先度: 中）

#### 3.1 モーダル背景の統一

**変更内容**:
- すべてのモーダルで `bg-black/50` を使用
- `createPortal` による body 直下レンダリングを標準化

**修正対象**:
- Modal.tsx
- ConfirmModal.tsx
- ExerciseTypeManager.tsx

#### 3.2 モーダルPropsの統一

```tsx
// 共通Props
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}
```

---

### Phase 4: Tailwindカスタムカラー統一（優先度: 中）

#### 4.1 カラーパレット定義の明確化

**tailwind.config.js の拡張**:

```js
colors: {
  // プライマリ（メインアクション用）
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    900: '#312E81',
  },
  // セカンダリ（サブアクション用）
  secondary: {
    // ...
  },
  // 意味的カラー
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
}
```

#### 4.2 hardcodedカラーの置換

| 現状 | 変更後 | 用途 |
|-----|-------|-----|
| `indigo-600` | `primary-600` | メインボタン |
| `blue-600` | `primary-600` or `info` | 情報系 |
| `green-600` | `success` | 成功系 |
| `red-600` | `danger` | 削除/警告 |
| `orange-*` | 定義追加 | 間食タグ |
| `purple-*` | 定義追加 | 飲酒タグ |

---

### Phase 5: コード規約の統一（優先度: 低）

#### 5.1 型定義規約

```tsx
// Props定義: export interface を使用
export interface ComponentNameProps {
  // ...
}

// 内部型: type を使用
type InternalState = {
  // ...
}
```

#### 5.2 関数コンポーネント規約

```tsx
// 標準形式
export function ComponentName({
  prop1,
  prop2,
}: ComponentNameProps): React.ReactElement {
  // ...
}

// memo使用時
export const ComponentName = memo(function ComponentName({
  prop1,
}: ComponentNameProps): React.ReactElement {
  // ...
});
```

#### 5.3 イベントハンドラー命名規約

```tsx
// 内部ハンドラー: handle + 動詞
const handleClick = () => { ... }
const handleSubmit = (e: React.FormEvent) => { ... }
const handleDelete = (id: string) => { ... }

// Props callback: on + 名詞/動詞
interface Props {
  onClick?: () => void;
  onSubmit?: (data: FormData) => void;
  onDelete?: (id: string) => void;
}
```

#### 5.4 ファイル構成規約

```
src/
├── ui/                    # 共通UIコンポーネント
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Modal.tsx
│   ├── ConfirmModal.tsx
│   ├── PageHeader.tsx
│   ├── LoadingSpinner.tsx
│   ├── ErrorDisplay.tsx
│   └── index.ts           # barrel export
├── layout/                # レイアウト
│   ├── MainLayout.tsx
│   ├── UserHeader/
│   │   ├── index.tsx
│   │   ├── NavigationLinks.tsx
│   │   ├── UserDropdown.tsx
│   │   └── MobileMenu.tsx
├── hooks/                 # カスタムフック
├── [feature]/             # 機能別ディレクトリ
│   ├── FeaturePage.tsx
│   ├── FeatureForm.tsx
│   ├── FeatureList.tsx
│   └── index.ts
```

---

### Phase 6: APIキャッシュ・データフェッチング最適化（優先度: 高）

#### 現状の問題点

| ページ | 初回取得 | タブ切替時 | 手動更新 | 問題 |
|-------|---------|----------|---------|------|
| Dashboard | mount時 | 再取得なし | Refreshボタン | キャッシュなし、毎回fetch |
| Ranking | mount時 | isAuth変更時のみ | なし | 手動更新不可 |
| Activities | ダミーデータ | - | - | API未実装 |

**主な課題**:
1. タブ切り替え毎にAPIが実行される（同じデータを何度も取得）
2. キャッシュ機構がない
3. API定義が分散（Dashboard内にインライン、authApi等）
4. エラーハンドリングが不統一

#### 6.1 推奨: TanStack Query（React Query）の導入

**業界デファクトスタンダード**: TanStack Query v5

```bash
pnpm add @tanstack/react-query
```

**選定理由**:
- 自動キャッシュ管理（staleTime, gcTime設定可能）
- バックグラウンド再取得（stale-while-revalidate戦略）
- 重複リクエスト自動排除
- エラーリトライ機能
- DevTools付き
- React 19対応

#### 6.2 キャッシュ戦略

```tsx
// キャッシュ設定の推奨値
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5分間はfresh（再取得しない）
      gcTime: 10 * 60 * 1000,       // 10分間キャッシュ保持
      refetchOnWindowFocus: false,  // タブフォーカス時の再取得を無効化
      retry: 1,                      // リトライ1回
    },
  },
});
```

**データ更新トリガー**:
1. **自動**: staleTime経過後、次回アクセス時
2. **手動**: Refreshボタン（`queryClient.invalidateQueries()`）
3. **Mutation後**: データ追加/更新/削除時に自動invalidate

#### 6.3 実装例

**新規ファイル**: `apps/frontend/src/api/queries.ts`

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../auth/services/authApi';

// クエリキー定義
export const queryKeys = {
  records: ['records'] as const,
  stats: ['stats'] as const,
  ranking: ['ranking'] as const,
  activities: ['activities'] as const,
};

// 記録一覧取得
export function useRecords() {
  return useQuery({
    queryKey: queryKeys.records,
    queryFn: async () => {
      const res = await authApi.fetchWithAuth('records');
      if (!res.ok) throw new Error('記録の取得に失敗しました');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5分
  });
}

// 統計情報取得
export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => {
      const res = await authApi.fetchWithAuth('stats');
      if (!res.ok) throw new Error('統計の取得に失敗しました');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 記録追加Mutation
export function useAddRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecordRequest) => {
      const res = await authApi.fetchWithAuth('records', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('記録の追加に失敗しました');
      return res.json();
    },
    onSuccess: () => {
      // 成功時にキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: queryKeys.records });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}
```

**Dashboard.tsx での使用例**:

```tsx
import { useRecords, useStats, useAddRecord } from '../api/queries';

export function Dashboard() {
  const { data: records, isLoading, error, refetch } = useRecords();
  const { data: stats } = useStats();
  const addRecordMutation = useAddRecord();

  const handleAddRecord = (data: FormData) => {
    addRecordMutation.mutate(data);
  };

  return (
    <div>
      {/* Refreshボタン */}
      <button onClick={() => refetch()}>
        更新
      </button>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorDisplay message={error.message} />}
      {records && <RecordList records={records} />}
    </div>
  );
}
```

#### 6.4 UI改善: 更新ボタンの追加

**PageHeader に統合**:

```tsx
export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onRefresh?: () => void;      // 更新ボタン
  isRefreshing?: boolean;      // 更新中状態
  lastUpdated?: Date;          // 最終更新時刻表示
}
```

**表示例**:
```
┌────────────────────────────────────────┐
│ 📊 ダッシュボード          最終更新: 5分前 🔄 │
│ 体重・体脂肪率の記録を管理                    │
└────────────────────────────────────────┘
```

#### 6.5 代替案: SWR

TanStack Queryが重い場合の軽量代替:

```bash
pnpm add swr
```

```tsx
import useSWR from 'swr';

const fetcher = (url: string) => authApi.fetchWithAuth(url).then(r => r.json());

function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR('/api/records', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000, // 5分
  });

  return (
    <button onClick={() => mutate()}>更新</button>
  );
}
```

#### 6.6 移行ステップ

1. **TanStack Query導入**
   - パッケージインストール
   - QueryClientProvider設定（App.tsx）

2. **API関数の一元化**
   - `src/api/queries.ts` 作成
   - 各ページのインラインAPI定義を移行

3. **Dashboard移行**
   - useRecords, useStats フック使用
   - Refreshボタン追加

4. **RankingPage移行**
   - useRanking フック使用
   - 手動更新ボタン追加

5. **ActivitiesPage移行**（バックエンドAPI実装後）
   - useActivities フック使用

#### 6.7 ファイル構成（実装後）

```
src/
├── api/
│   ├── client.ts           # fetch wrapper（authApi統合）
│   ├── queries.ts          # TanStack Query hooks
│   ├── queryClient.ts      # QueryClient設定
│   └── types.ts            # API型定義
├── providers/
│   └── QueryProvider.tsx   # QueryClientProvider
```

---

## 実装優先順位

### 即時対応（Phase 1-2, 6）

1. **TanStack Query導入** → キャッシュ基盤構築（最優先）
2. **Button.tsx 作成** → 全ファイルのボタン置換
3. **Card.tsx 作成** → "card" クラスの明確化
4. **PageHeader.tsx 作成** → ヘッダー統一（更新ボタン含む）
5. **Badge.tsx 作成** → タグ表示統一

### 次フェーズ（Phase 3-4）

6. **API関数一元化** → queries.ts への移行
7. **モーダル背景統一**
8. **Tailwindカラー統一**
9. **Input.tsx 作成**

### 将来対応（Phase 5）

10. **UserHeader分割**
11. **型定義規約適用**
12. **命名規約適用**

---

### Phase 7: ダークモード対応（優先度: 中）

#### 7.1 概要

ユーザーの好みやシステム設定に応じてダークモードを切り替え可能にする。

#### 7.2 実装方針

**Tailwind CSS の `dark:` プレフィックスを使用**

```tsx
// ライトモード / ダークモード対応例
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

#### 7.3 カラー設計

**セマンティックカラーの定義**（tailwind.config.js）:

```js
// CSS変数を使用したカラー管理
colors: {
  // 背景色
  surface: {
    DEFAULT: 'var(--color-surface)',        // 白 / gray-900
    secondary: 'var(--color-surface-secondary)', // gray-50 / gray-800
    elevated: 'var(--color-surface-elevated)',   // 白 / gray-700
  },
  // テキスト色
  content: {
    DEFAULT: 'var(--color-content)',        // gray-900 / gray-100
    secondary: 'var(--color-content-secondary)', // gray-600 / gray-400
    muted: 'var(--color-content-muted)',    // gray-400 / gray-500
  },
  // ボーダー色
  border: {
    DEFAULT: 'var(--color-border)',         // gray-200 / gray-700
  },
}
```

**CSS変数定義** (`index.css`):

```css
:root {
  --color-surface: #ffffff;
  --color-surface-secondary: #f9fafb;
  --color-surface-elevated: #ffffff;
  --color-content: #111827;
  --color-content-secondary: #4b5563;
  --color-content-muted: #9ca3af;
  --color-border: #e5e7eb;
}

.dark {
  --color-surface: #111827;
  --color-surface-secondary: #1f2937;
  --color-surface-elevated: #374151;
  --color-content: #f3f4f6;
  --color-content-secondary: #9ca3af;
  --color-content-muted: #6b7280;
  --color-border: #374151;
}
```

#### 7.4 ダークモード切り替え

**方法1: システム設定に追従**（推奨）

```js
// tailwind.config.js
darkMode: 'media', // prefers-color-scheme に追従
```

**方法2: 手動切り替え**

```js
// tailwind.config.js
darkMode: 'class', // <html class="dark"> で制御

// ThemeContext で管理
const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
```

#### 7.5 移行ステップ

1. **CSS変数とセマンティックカラー定義**
2. **共通コンポーネントにdark:プレフィックス追加**
3. **Activities周りで先行対応**（完了予定）
4. **他ページへ展開**（リファクタリング時）
5. **テーマ切り替えUI追加**（UserHeader内）

#### 7.6 対応済み箇所

- [x] Activities - ActivityForm.tsx（セクション背景をdark:対応）
- [x] Activities - RatingButtons.tsx（ボタン色をdark:対応）
- [ ] Dashboard
- [ ] Ranking
- [ ] 共通コンポーネント（Modal, Card等）

---

## 期待される効果

1. **保守性向上**: スタイル変更が一箇所で完結
2. **開発効率向上**: 共通コンポーネント再利用
3. **デザイン一貫性**: ユーザー体験の向上
4. **コードレビュー効率化**: 明確な規約による判断基準
5. **新規開発者のオンボーディング**: 理解しやすいコード構造

---

## 参考: 共通UIコンポーネント一覧（実装後）

```
src/ui/
├── Button.tsx          # ボタン（variant, size, loading対応）
├── Input.tsx           # 入力フィールド（label, error対応）
├── Select.tsx          # セレクトボックス
├── Card.tsx            # カード（variant対応）
├── Badge.tsx           # バッジ/タグ（color対応）
├── Modal.tsx           # モーダル基盤
├── ConfirmModal.tsx    # 確認モーダル
├── PageHeader.tsx      # ページヘッダー
├── LoadingSpinner.tsx  # ローディング
├── ErrorDisplay.tsx    # エラー表示
└── index.ts            # barrel export
```
