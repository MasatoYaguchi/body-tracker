import { Suspense, useState } from 'react';
import { AuthProvider, useAuthConditional } from './auth';
import { AuthCallback } from './auth/components/AuthCallback';
import { Dashboard } from './dashboard/Dashboard';
import { LoginScreen } from './layout/LoginScreen';
import { UserHeader } from './layout/UserHeader';
import { RankingPage } from './ranking/RankingPage';
import { LoadingSpinner } from './ui/LoadingSpinner';

/**
 * 🆕 React 19新機能を活用したメインアプリケーションコンテンツ
 *
 * - useAuthConditional: 認証状態による条件付きレンダリング
 * - 分割されたコンポーネントによる保守性向上
 */
function AppContent(): React.ReactElement {
  const { showForAuth, showForGuest, showWhileLoading } = useAuthConditional();
  const [currentView, setCurrentView] = useState<'dashboard' | 'ranking'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ローディング状態 */}
      {showWhileLoading(<LoadingSpinner size="large" message="認証状態を確認中..." fullScreen />)}

      {/* 認証済みユーザー向け */}
      {showForAuth(
        <div>
          <UserHeader currentView={currentView} onNavigate={(view) => setCurrentView(view)} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'dashboard' ? <Dashboard /> : <RankingPage />}
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
  if (window.location.pathname === '/auth/callback') return <AuthCallback />;
  return (
    <Suspense fallback={<LoadingSpinner size="large" message="読み込み中..." fullScreen />}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Suspense>
  );
}
