// apps/frontend/src/App.tsx
// 認証システム統合版メインアプリケーション（簡潔版）

import { GoogleOAuthProvider } from '@react-oauth/google';
import { Suspense } from 'react';
import { AuthProvider, useAuthConditional } from './auth';
import { Dashboard } from './dashboard/Dashboard';
import { LoginScreen } from './layout/LoginScreen';
import { UserHeader } from './layout/UserHeader';
import { LoadingSpinner } from './ui/LoadingSpinner';

// ===== 環境変数の取得 =====

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  throw new Error('VITE_GOOGLE_CLIENT_ID environment variable is required');
}

/**
 * 🆕 React 19新機能を活用したメインアプリケーションコンテンツ
 *
 * - useAuthConditional: 認証状態による条件付きレンダリング
 * - 分割されたコンポーネントによる保守性向上
 */
function AppContent(): React.ReactElement {
  const { showForAuth, showForGuest, showWhileLoading } = useAuthConditional();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ローディング状態 */}
      {showWhileLoading(<LoadingSpinner size="large" message="認証状態を確認中..." fullScreen />)}

      {/* 認証済みユーザー向け */}
      {showForAuth(
        <div>
          <UserHeader />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Dashboard />
          </main>
        </div>,
      )}

      {/* 未認証ユーザー向け */}
      {showForGuest(<LoginScreen />)}
    </div>
  );
}

/**
 * ルートアプリケーションコンポーネント
 *
 * 🆕 React 19新機能:
 * - Suspenseによる段階的読み込み
 * - プロバイダーの階層化
 * - エラーバウンダリーとの統合
 *
 * @returns React.ReactElement
 */
export default function App(): React.ReactElement {
  return (
    <Suspense
      fallback={<LoadingSpinner size="large" message="アプリケーション読み込み中..." fullScreen />}
    >
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </GoogleOAuthProvider>
    </Suspense>
  );
}
