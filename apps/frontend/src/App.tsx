import type React from 'react';
import { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { AuthCallback } from './auth/components/AuthCallback';
import { Dashboard } from './dashboard/Dashboard';
import { LoginScreen } from './layout/LoginScreen';
import { MainLayout } from './layout/MainLayout';
import { RankingPage } from './ranking/RankingPage';
import { LoadingSpinner } from './ui/LoadingSpinner';

/**
 * 認証ガードコンポーネント
 * 未認証ユーザーはログイン画面へリダイレクト
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // 初期ロード中はスピナーを表示
  if (isLoading) return <LoadingSpinner fullScreen message="認証情報を確認中..." />;

  // 未認証ならログインへ
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

/**
 * ゲストガードコンポーネント
 * 認証済みユーザーはダッシュボードへリダイレクト（ログイン画面などの二重アクセス防止）
 */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner fullScreen />;

  // 認証済みならダッシュボードへ
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

/**
 * ルートアプリケーションコンポーネント
 *
 * react-router-domによるルーティング管理に移行
 *
 * - / : ダッシュボード (要認証)
 * - /ranking : ランキング (誰でも閲覧可)
 * - /login : ログイン (ゲストのみ)
 */
export default function App(): React.ReactElement {
  return (
    <Suspense fallback={<LoadingSpinner size="large" message="読み込み中..." fullScreen />}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* OAuthコールバック - 最優先 */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* ゲストルート */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginScreen />
                </GuestRoute>
              }
            />

            {/* メインレイアウト適用ルート */}
            <Route element={<MainLayout />}>
              {/* ダッシュボード (認証必須) */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* ランキング (公開) */}
              <Route path="/ranking" element={<RankingPage />} />
            </Route>

            {/* 未定義パスはルートへ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Suspense>
  );
}
