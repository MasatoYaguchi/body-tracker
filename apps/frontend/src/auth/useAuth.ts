// apps/frontend/src/auth/useAuth.ts
// React 19新機能を活用したカスタムフック集（修正版）

import { useContext } from 'react';
import { AuthContext } from './providers/AuthContext';
import type { AuthContextType } from './types/auth.types';

// ===== 基本認証フック =====

/**
 * 認証状態とメソッドにアクセスするフック
 *
 * React 19新機能:
 * - useOptimistic状態の自動取得
 * - useTransition状態の取得
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// ===== 認証必須フック =====

/**
 * 認証が必要なコンポーネントで使用するフック
 *
 * 未認証の場合はErrorを投げてErrorBoundaryでキャッチ
 * Suspenseと組み合わせて使用することを推奨
 */
export function useRequireAuth(): AuthContextType {
  const auth = useAuth();

  if (!auth.isAuthenticated && !auth.isLoading) {
    throw new Error('Authentication required');
  }

  return auth;
}

// ===== 複合ロジックフック =====

/**
 * 現在のユーザー情報のみを返すフック
 *
 * 認証状態をチェックした上でユーザー情報を返す
 * 未認証の場合はnullを返す
 */
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated ? user : null;
}

// ===== 条件付きレンダリングフック =====

/**
 * 認証状態に応じたコンポーネント表示判定フック
 *
 * 使用例:
 * const { showForAuth, showForGuest } = useAuthConditional();
 * return showForAuth(<UserDashboard />) || showForGuest(<LoginForm />);
 */
export function useAuthConditional() {
  const { isAuthenticated, isLoading } = useAuth();

  return {
    showForAuth: (component: React.ReactNode) => (isAuthenticated && !isLoading ? component : null),
    showForGuest: (component: React.ReactNode) =>
      !isAuthenticated && !isLoading ? component : null,
    showWhileLoading: (component: React.ReactNode) => (isLoading ? component : null),
  };
}
