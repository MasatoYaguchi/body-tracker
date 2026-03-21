# UI/コード一貫性リファクタリング計画

<section id="critical-security">

## 緊急対応（セキュリティ） <span style="color: red; font-weight: bold;">【即時対応必要】</span>

> **参照**: [review-security-consistency-bestpractices-2026-03-21.md](review-security-consistency-bestpractices-2026-03-21.md)

<article id="critical-1">

### 1. Google IDトークン検証方式の改善 <span style="color: red; font-weight: bold;">【High】</span>

**ファイル**: `apps/backend/src/auth/google.ts:65`

**現状の問題**:
```typescript
// id_token を URL クエリに載せている（ログや監視基盤で露出リスク）
const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
```

**改善案**:
- google-auth-library で JWKS ベースの署名検証に切り替え（サーバー内で完結）
- または最低でもトークン文字列をURLに含めない方式に統一

</article>

<article id="critical-2">

### 2. PKCE state のランダム化 <span style="color: red; font-weight: bold;">【High】</span>

**ファイル**: `apps/frontend/src/auth/services/authCodeFlow.ts:20,38`

**現状の問題**:
```typescript
// state が常に 'login' で固定（CSRF 耐性が弱い）
state = 'login'
if (state !== 'login') return err(...)
```

**改善案**:
- state を都度ランダム生成し sessionStorage に保存
- callback で完全一致検証し、検証後は即削除

```typescript
// 改善例
const state = crypto.randomUUID();
sessionStorage.setItem('pkce_state', state);
// callback で検証
const savedState = sessionStorage.getItem('pkce_state');
if (state !== savedState) return err(...);
sessionStorage.removeItem('pkce_state');
```

</article>

<article id="critical-3">

### 3. 認証関連デバッグログの削除・マスキング <span style="color: red; font-weight: bold;">【Medium】</span>

**ファイル**:
- `apps/frontend/src/auth/components/AuthCallback.tsx:12`
- `apps/frontend/src/auth/services/authApi.ts:171`

**現状の問題**:
```typescript
// URL 全体（code を含む可能性）をログ出力
console.log('AuthCallback mounted', window.location.href);
```

**改善案**:
- 本番ビルドで機密ログを禁止
- 認証関連ログは requestId と結果コード中心に最小化
- 機密情報はマスク処理

</article>

<article id="critical-4">

### 4. Linter を Biome に一本化 <span style="color: red; font-weight: bold;">【Medium】</span>

**現状の問題**:
- ESLint v9 で `eslint.config.js` 不在のため `pnpm lint` が失敗
- Biome と ESLint が混在している

**改善案**:
- ESLint を削除し Biome に一本化
- `package.json` の lint スクリプトから ESLint 呼び出しを削除
- Biome の設定で必要なルールを追加

</article>

</section>

---

<section id="short-term-security">

## 短期対応（1週間以内）

<article id="short-1">

### 5. セキュリティヘッダーの導入 <span style="color: red; font-weight: bold;">【Medium】</span>

**ファイル**: `apps/backend/src/server.ts`

**現状の問題**:
- CSP、X-Content-Type-Options、Referrer-Policy 等の防御層が不足

**改善案**:
```typescript
import { secureHeaders } from 'hono/secure-headers';

app.use('*', secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    connectSrc: ["'self'", 'https://oauth2.googleapis.com'],
  },
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
}));
```

</article>

<article id="short-2">

### 6. APIクライアントの一本化

**ファイル**: `apps/frontend/src/dashboard/Dashboard.tsx:24-25`

**現状の問題**:
```typescript
// Dashboard 側が独自 fetch + localStorage 直参照
const token = localStorage.getItem('authToken');
```

**改善案**:
- 共通 API クライアント（authApi）へ統一
- auth header、401処理、エラーマッピングを一元化
- Phase 6 の TanStack Query 導入と合わせて対応

</article>

<article id="short-3">

### 7. CORS判定の厳密化

**ファイル**: `apps/backend/src/server.ts:37-38`

**現状の問題**:
```typescript
// startsWith ベースで誤判定リスク
origin.startsWith('http://localhost:3000')
```

**改善案**:
- URL パース後の origin 厳密一致（許可リスト）へ変更
- 環境変数ベースで許可 origin を集中管理

</article>

</section>

---

<section id="medium-term-security">

## 中期対応（2-4週間）

<article id="medium-1">

### 8. トークン運用の再設計

**現状の問題**:
- JWT 有効期限が30日と長い
- サーバー側で無効化できない設計
- localStorage 保持で XSS 時の窃取リスク

**改善案**:
- 短寿命 access token（15分〜1時間）+ refresh token ローテーション
- 失効リストまたは token version 戦略の導入
- 中長期: HttpOnly + Secure + SameSite Cookie ベースに移行

</article>

<article id="medium-2">

### 9. 認証フローの一本化

**現状の問題**:
- 実際の導線は code flow なのに API・型・コメントに旧方式（ID token 直接送信）が残存

**改善案**:
- 方式を code flow に一本化
- 未使用 endpoint/型/関数を整理

</article>

<article id="medium-3">

### 10. Vitest によるテスト基盤の導入

**現状の問題**:
- テストファイルが存在しない
- 認証とランキング集計ロジックの回帰検知ができない

**改善案**:
- Vitest でテスト基盤を構築
- `vitest.config.ts` をワークスペースルートに配置
- 優先テスト対象:
  - auth code flow（PKCE、state検証）
  - token validation（JWT署名検証）
  - ranking aggregation（スコア計算）
- カバレッジ目標: 認証・ランキングロジックは80%以上

</article>

</section>

---

<section id="overview">

## 概要

現在のコードベースにはUI/コードの一貫性に関する問題が多数存在します。本ドキュメントでは、一般的なベストプラクティスに基づいたリファクタリング計画を提案します。

</section>

---

<section id="current-issues">

## 現状の問題点

<article id="issue-button-styles">

### 1. ボタンスタイルの分散

| ファイル | スタイル例 | 問題点 |
|---------|----------|-------|
| UserHeader.tsx | `bg-indigo-600 hover:bg-indigo-700` | hardcodedカラー |
| Dashboard.tsx | `bg-red-600 rounded-md shadow-sm` | サイズ不統一 |
| ActivityForm.tsx | `bg-green-600 rounded-lg transition-colors` | 異なるrounding |
| LoginScreen.tsx | `bg-blue-600 py-3 rounded-md shadow` | 異なるpadding |

</article>

<article id="issue-header-inconsistency">

### 2. ヘッダー実装の不統一

- **UserHeader.tsx**: 316行の多機能コンポーネント（ナビ、ドロップダウン、ログアウト）
- **DashboardHeader.tsx**: グラデーション背景の独立コンポーネント
- 各ページのヘッダー部分も独自実装

</article>

<article id="issue-modal-background">

### 3. モーダル背景色の不統一

```tsx
// Modal.tsx
bg-gray-500 bg-opacity-75

// ConfirmModal.tsx
bg-black/50
```

</article>

<article id="issue-custom-colors">

### 4. カスタムカラーの混在

```tsx
// Tailwind設定にprimaryを定義しているが...
primary-600  // 一部で使用
indigo-600   // 別の場所で使用
blue-600     // また別の場所で使用
```

</article>

<article id="issue-type-naming">

### 5. 型定義・命名規則の不統一

- `export interface` vs `interface` の使い分けなし
- イベントハンドラー: `handle*` vs `on*` vs シンプル動詞
- 関数コンポーネントの戻り値型の明記がない場合あり

</article>

</section>

---

<section id="refactoring-plan">

## リファクタリング計画

<article id="phase-1">

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

#### 1.5 共通アイコンコンポーネントの作成 <span style="color: red; font-weight: bold;">【完了】</span>

**ファイル**: `apps/frontend/src/ui/Icons.tsx`

- EditIcon, DeleteIcon, PlusIcon, CloseIcon
- RefreshIcon, ClipboardIcon, ClipboardCheckIcon, ClipboardListIcon
- すべて `aria-hidden="true"` と `focusable="false"` を設定

</article>

---

<article id="phase-2">

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

</article>

---

<article id="phase-3">

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

</article>

---

<article id="phase-4">

### Phase 4: Tailwindカスタムカラー統一（優先度: 中）

#### 4.1 カラーパレット定義の明確化 <span style="color: red; font-weight: bold;">【要リファクタリング】</span>

**ファイル**: `apps/frontend/src/index.css`

**現状**: CSS変数によるカラートークン定義済みだが、不要な定義が多い

**次のアクション**:
- 全体的なカラー統一と合わせて、実際に使用するカラーのみに整理
- 未使用のカラー定義を削除
- 必要最小限のカラーパレットに統一

#### 4.2 hardcodedカラーの置換

| 現状 | 変更後 | 用途 |
|-----|-------|-----|
| `indigo-600` | `primary-600` | メインボタン |
| `blue-600` | `primary-600` or `info` | 情報系 |
| `green-600` | `success` | 成功系 |
| `red-600` | `danger` | 削除/警告 |
| `orange-*` | 定義追加 | 間食タグ |
| `purple-*` | 定義追加 | 飲酒タグ |

</article>

---

<article id="phase-5">

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

</article>

---

<article id="phase-6">

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
│ ダッシュボード          最終更新: 5分前  │
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

</article>

---

</section>

<section id="implementation-priority">

## 実装優先順位

<article id="priority-immediate">

### 即時対応（Phase 1-2, 6）

1. **TanStack Query導入** → キャッシュ基盤構築（最優先）
2. **Button.tsx 作成** → 全ファイルのボタン置換
3. **Card.tsx 作成** → "card" クラスの明確化
4. **PageHeader.tsx 作成** → ヘッダー統一（更新ボタン含む）
5. **Badge.tsx 作成** → タグ表示統一
6. **Icons.tsx 作成** → 共通アイコン <span style="color: red; font-weight: bold;">【完了】</span>

</article>

<article id="priority-next">

### 次フェーズ（Phase 3-4）

7. **API関数一元化** → queries.ts への移行
8. **モーダル背景統一**
9. **Tailwindカラー統一** <span style="color: red; font-weight: bold;">【要リファクタリング】</span>
10. **Input.tsx 作成**

</article>

<article id="priority-future">

### 将来対応（Phase 5, 9）

11. **UserHeader分割**
12. **型定義規約適用**
13. **命名規約適用**
14. **Fitbit Web API連携** → 体重・体脂肪率の自動同期

</article>

</section>

---

<section id="phase-7">

### Phase 7: ダークモード対応（優先度: 中）

<article id="dark-mode-overview">

#### 7.1 概要

ユーザーの好みやシステム設定に応じてダークモードを切り替え可能にする。

</article>

<article id="dark-mode-implementation">

#### 7.2 実装方針

**Tailwind CSS の `dark:` プレフィックスを使用**

```tsx
// ライトモード / ダークモード対応例
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

</article>

<article id="dark-mode-colors">

#### 7.3 カラー設計 <span style="color: red; font-weight: bold;">【要リファクタリング】</span>

**セマンティックカラーの定義**（`apps/frontend/src/index.css`）:

**現状**: CSS変数を使用したカラー管理済みだが、不要な定義が多い

**次のアクション**:
- 実際に使用するカラーのみに整理
- surface, content, border等の必要最小限に統一
- 全体的なUI統一と合わせてリファクタリング予定

</article>

<article id="dark-mode-toggle">

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

</article>

<article id="dark-mode-migration">

#### 7.5 移行ステップ

1. **CSS変数とセマンティックカラー定義** <span style="color: red; font-weight: bold;">【要リファクタリング】</span>
2. **共通コンポーネントにdark:プレフィックス追加**
3. **Activities周りで先行対応** <span style="color: red; font-weight: bold;">【完了】</span>
4. **他ページへ展開**（リファクタリング時）
5. **テーマ切り替えUI追加**（UserHeader内）

</article>

<article id="dark-mode-status">

#### 7.6 対応済み箇所

- [x] index.css - カラートークン定義 <span style="color: red; font-weight: bold;">【要リファクタリング】</span>（不要な定義が多いため整理予定）
- [x] Activities - ActivityForm.tsx（セクション背景をdark:対応） <span style="color: red; font-weight: bold;">【完了】</span>
- [x] Activities - ActivityList.tsx <span style="color: red; font-weight: bold;">【完了】</span>
- [x] Activities - RatingButtons.tsx（ボタン色をdark:対応） <span style="color: red; font-weight: bold;">【完了】</span>
- [ ] Dashboard
- [ ] Ranking
- [ ] 共通コンポーネント（Modal, Card等）

</article>

</section>

---

<section id="accessibility">

### Phase 8: アクセシビリティ対応（優先度: 高）

<article id="a11y-icons">

#### 8.1 アイコンのアクセシビリティ <span style="color: red; font-weight: bold;">【完了】</span>

**対応内容**:
- すべてのSVGアイコンに `aria-hidden="true"` を設定
- `focusable="false"` を追加してフォーカスを防止
- Icons.tsx に共通化

</article>

<article id="a11y-forms">

#### 8.2 フォームのアクセシビリティ <span style="color: red; font-weight: bold;">【完了】</span>

**対応内容**:
- トグルスイッチ: ネイティブ `<input type="checkbox">` + `sr-only` に変更
- `aria-labelledby` による関連付け
- UserHeader: `aria-expanded` を文字列値で設定

</article>

<article id="a11y-pending">

#### 8.3 残タスク

- [ ] すべてのモーダルに適切なフォーカス管理
- [ ] キーボードナビゲーションの確認
- [ ] スクリーンリーダーテスト

</article>

</section>

---

<section id="phase-9">

### Phase 9: Fitbit Web API連携（優先度: 中）

<article id="fitbit-overview">

#### 9.1 概要

Fitbit Web APIを利用して、体重・体脂肪率データを双方向で同期する機能を追加する。
Fitbitアプリと本アプリのデータを連携させ、どちらで入力しても同期されるようにする。

</article>

<article id="fitbit-features">

#### 9.2 機能要件

| 機能 | 説明 | 優先度 |
|------|------|--------|
| Fitbitアカウント連携 | OAuth 2.0 (PKCE) による認証 | 高 |
| Fitbit → 本アプリ | Weight/Body Fat Logsからデータ取得 | 高 |
| 本アプリ → Fitbit | 本アプリで入力したデータをFitbitへ送信 | 高 |
| 双方向自動同期 | 定期的な双方向データ同期（日次） | 中 |
| 手動同期 | ユーザー操作による即時同期 | 高 |
| 競合解決 | 同日データの競合時の処理（タイムスタンプ優先） | 中 |
| 連携解除 | Fitbitアカウントとの連携解除 | 中 |

</article>

<article id="fitbit-api">

#### 9.3 使用するFitbit API

**認証**:
- Authorization Code Grant with PKCE
- スコープ: `weight` (体重・体脂肪率へのアクセス)

**エンドポイント**:

```
# 体重ログ取得（期間指定）
GET /1/user/-/body/log/weight/date/{start-date}/{end-date}.json

# 体脂肪率ログ取得（期間指定）
GET /1/user/-/body/log/fat/date/{start-date}/{end-date}.json

# 最新の体重データ
GET /1/user/-/body/log/weight/date/today.json

# 体重ログ登録（本アプリ → Fitbit）
POST /1/user/-/body/log/weight.json
  - weight: 体重（kg）
  - date: 日付（yyyy-MM-dd）
  - time: 時刻（HH:mm:ss）

# 体脂肪率ログ登録（本アプリ → Fitbit）
POST /1/user/-/body/log/fat.json
  - fat: 体脂肪率（%）
  - date: 日付（yyyy-MM-dd）
  - time: 時刻（HH:mm:ss）
```

**レスポンス例**:
```json
{
  "weight": [
    {
      "bmi": 23.5,
      "date": "2024-01-15",
      "fat": 18.5,
      "logId": 1234567890,
      "source": "Aria",
      "time": "07:30:00",
      "weight": 70.5
    }
  ]
}
```

</article>

<article id="fitbit-implementation">

#### 9.4 実装計画

**バックエンド**:

```
apps/backend/src/
├── routes/
│   └── fitbit.ts              # Fitbit API関連エンドポイント
├── services/
│   └── fitbitService.ts       # Fitbit API クライアント
├── db/
│   └── schema.ts              # fitbit_tokens テーブル追加
```

**DBスキーマ追加**:

```typescript
export const fitbitTokens = pgTable('fitbit_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  scope: varchar('scope', { length: 255 }),
  fitbitUserId: varchar('fitbit_user_id', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

**APIエンドポイント**:

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/fitbit/auth` | 認証URL生成（PKCE対応） |
| POST | `/api/fitbit/callback` | OAuth callback処理 |
| GET | `/api/fitbit/status` | 連携状態確認 |
| POST | `/api/fitbit/sync` | 手動同期実行 |
| DELETE | `/api/fitbit/disconnect` | 連携解除 |

**フロントエンド**:

```
apps/frontend/src/
├── settings/
│   └── FitbitConnection.tsx   # Fitbit連携設定コンポーネント
├── api/
│   └── fitbitApi.ts           # Fitbit API呼び出し
```

</article>

<article id="fitbit-auth-flow">

#### 9.5 認証フロー

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │     │   Backend   │     │  Fitbit API │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │ 1. 連携ボタンクリック │                   │
       │──────────────────>│                   │
       │                   │                   │
       │ 2. 認証URL + state │                   │
       │<──────────────────│                   │
       │                   │                   │
       │ 3. Fitbit認証画面へリダイレクト           │
       │──────────────────────────────────────>│
       │                   │                   │
       │ 4. 認可コード付きでコールバック            │
       │<──────────────────────────────────────│
       │                   │                   │
       │ 5. 認可コード送信   │                   │
       │──────────────────>│                   │
       │                   │ 6. トークン交換     │
       │                   │──────────────────>│
       │                   │                   │
       │                   │ 7. アクセストークン  │
       │                   │<──────────────────│
       │                   │                   │
       │ 8. 連携完了        │                   │
       │<──────────────────│                   │
```

</article>

<article id="fitbit-sync-strategy">

#### 9.6 同期戦略

**初回同期**:
- 連携完了時に過去30日分のデータをFitbitから取得
- 本アプリの既存データをFitbitへ送信
- 重複チェック（日付 + 時刻ベース）

**定期同期（双方向）**:
- Cloudflare Workers Cron Triggers使用
- 1日1回（深夜）実行
- Fitbit → 本アプリ: 前日分のデータを取得
- 本アプリ → Fitbit: 未同期データを送信

**手動同期**:
- ダッシュボードから即時同期可能
- 双方向で指定期間のデータを同期

**競合解決**:
- 同日・同時刻のデータが存在する場合:
  - タイムスタンプが新しい方を優先
  - ユーザー設定で「Fitbit優先」「本アプリ優先」を選択可能

**データソース識別**:

```typescript
// body_records テーブルに source カラム追加
source: varchar('source', { length: 20 }).default('manual'),
// 'manual' | 'fitbit'

// Fitbit同期済みフラグ
fitbitSynced: boolean('fitbit_synced').default(false),
fitbitLogId: bigint('fitbit_log_id'), // FitbitのログID（重複防止用）
```

</article>

<article id="fitbit-ui">

#### 9.7 UI設計

**設定ページ（新規）**:

```
┌────────────────────────────────────────────────┐
│ ⚙️ 設定                                        │
├────────────────────────────────────────────────┤
│                                                │
│ 📊 外部サービス連携                              │
│ ┌──────────────────────────────────────────┐  │
│ │ Fitbit                                    │  │
│ │                                          │  │
│ │ ステータス: 🟢 連携中                       │  │
│ │ 最終同期: 2024/01/15 07:30               │  │
│ │                                          │  │
│ │ [今すぐ同期]  [連携解除]                   │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ Fitbit                                    │  │
│ │                                          │  │
│ │ ステータス: ⚪ 未連携                       │  │
│ │                                          │  │
│ │ Fitbitアカウントと連携すると、体重・体脂肪率  │  │
│ │ が自動で同期されます。                      │  │
│ │                                          │  │
│ │ [Fitbitと連携する]                        │  │
│ └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

</article>

<article id="fitbit-env">

#### 9.8 環境変数

```bash
# Fitbit API credentials
FITBIT_CLIENT_ID=your_client_id
FITBIT_CLIENT_SECRET=your_client_secret
FITBIT_REDIRECT_URI=https://your-app.com/api/fitbit/callback
```

</article>

<article id="fitbit-migration-steps">

#### 9.9 移行ステップ

1. **Fitbit Developer登録**
   - Fitbit Developer Portalでアプリ登録
   - OAuth 2.0設定（PKCE有効化）
   - リダイレクトURI設定

2. **バックエンド実装**
   - DBスキーマ追加（fitbit_tokens, sourceカラム）
   - fitbitService.ts 作成
   - routes/fitbit.ts 作成
   - トークンリフレッシュ処理

3. **フロントエンド実装**
   - 設定ページ作成
   - FitbitConnection.tsx 作成
   - 同期状態表示

4. **同期機能実装**
   - 手動同期
   - Cron Triggers設定（定期同期）

5. **テスト**
   - 認証フローテスト
   - データ同期テスト
   - エラーハンドリングテスト

</article>

<article id="fitbit-considerations">

#### 9.10 考慮事項

**レート制限**:
- Fitbit API: 150リクエスト/時間/ユーザー
- バッチ処理で効率化

**トークン管理**:
- アクセストークン有効期限: 8時間
- リフレッシュトークンによる自動更新
- 暗号化して保存

**エラーハンドリング**:
- トークン期限切れ → 自動リフレッシュ
- リフレッシュ失敗 → 再認証を促す
- API エラー → リトライ + 通知

**プライバシー**:
- 必要最小限のスコープのみ要求
- データの取り扱いを明記
- 連携解除時はトークン削除

</article>

</section>

---

<section id="expected-benefits">

## 期待される効果

1. **保守性向上**: スタイル変更が一箇所で完結
2. **開発効率向上**: 共通コンポーネント再利用
3. **デザイン一貫性**: ユーザー体験の向上
4. **コードレビュー効率化**: 明確な規約による判断基準
5. **新規開発者のオンボーディング**: 理解しやすいコード構造
6. **アクセシビリティ向上**: WCAG準拠
7. **データ入力の自動化**: Fitbitとの双方向同期による体重・体脂肪率の連携

</section>

---

<section id="ui-component-reference">

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
├── Icons.tsx           # 共通アイコン 【完了】
└── index.ts            # barrel export
```

</section>
