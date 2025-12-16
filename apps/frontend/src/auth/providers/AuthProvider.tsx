// apps/frontend/src/auth/providers/AuthProvider.tsx
// 簡潔化された認証プロバイダー（React 19新機能活用）

import { useCallback, useEffect, useMemo } from 'react';
import { useAuthState } from '../hooks/useAuthState';
import { authenticateWithGoogle, logout as logoutApi } from '../services/authApi';
import { authStorage } from '../services/authStorage';
import type { AuthContextType, User } from '../types/auth.types';
import { AuthContext } from './AuthContext';

/**
 * AuthProvider コンポーネントのProps
 */
interface AuthProviderProps {
  /** 子コンポーネント */
  children: React.ReactNode;
}

/**
 * 🆕 React 19新機能を活用した認証プロバイダー
 *
 * 機能を分離することで50行程度のシンプルなProviderを実現
 * - 状態管理: useAuthState フック
 * - API通信: authApi サービス
 * - ストレージ: authStorage サービス
 *
 * React 19新機能:
 * - useOptimistic: 楽観的更新による即座なUI反映
 * - useTransition: 認証処理の低優先度実行
 *
 * @param props - AuthProviderProps
 * @returns JSX.Element
 *
 * @example
 * ```typescript
 * // App.tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router>
 *         <Routes>
 *           <Route path="/login" element={<LoginPage />} />
 *           <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *         </Routes>
 *       </Router>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  // ===== React 19新機能: 状態管理フック =====

  const {
    optimisticState,
    isTransitioning,
    initializeAuthState,
    setLoggedIn,
    setLoggedOut,
    setLoading,
    updateAuthState,
  } = useAuthState();

  // ===== 初期化処理 =====

  /**
   * コンポーネント初期化時に認証状態を復元
   *
   * 🆕 React 19: useOptimistic により即座にUIに反映
   */
  useEffect(() => {
    initializeAuthState();
  }, [initializeAuthState]);

  // ===== ログイン処理 =====

  /**
   * Google認証実行
   *
   * 🆕 React 19新機能活用:
   * - 楽観的更新: ローディング状態を即座に表示
   * - useTransition: バックグラウンド処理でUIブロック防止
   *
   * @param credential - Google IDトークン
   * @throws {Error} 認証失敗時
   *
   * @example
   * ```typescript
   * const handleGoogleLogin = async (googleCredential: string) => {
   *   try {
   *     await login(googleCredential);
   *     navigate('/dashboard');
   *   } catch (error) {
   *     showErrorMessage(getAuthErrorMessage(error));
   *   }
   * };
   * ```
   */
  const login = useCallback(
    async (credential: string): Promise<void> => {
      console.log('🚀 Google認証開始...');

      try {
        // 🆕 React 19: 楽観的更新でローディング状態を即座に表示
        setLoading(true);

        // Google認証API呼び出し
        const { user, token } = await authenticateWithGoogle(credential);

        // 認証成功: ログイン状態に設定
        setLoggedIn(user, token);

        console.log('✅ Google認証成功:', user.email);
      } catch (error) {
        console.error('❌ Google認証失敗:', error);

        // エラー時はローディング解除
        setLoading(false);

        // エラーを再throw してUIでハンドリング
        throw error;
      }
    },
    [setLoading, setLoggedIn],
  );

  // ===== ログアウト処理 =====

  /**
   * ログアウト実行
   *
   * 🆕 React 19新機能:
   * - 楽観的更新: 即座にUIからユーザー情報を削除
   * - バックグラウンド: サーバー側ログアウト処理
   *
   * @example
   * ```typescript
   * const handleLogout = async () => {
   *   await logout();
   *   navigate('/login');
   * };
   * ```
   */
  const logout = useCallback(async (): Promise<void> => {
    console.log('🚪 ログアウト処理開始...');

    try {
      // 🆕 React 19: 楽観的更新で即座にログアウト状態に
      const currentToken = optimisticState.token;
      setLoggedOut();

      // バックグラウンドでサーバー側ログアウト
      if (currentToken) {
        await logoutApi(currentToken);
      }

      console.log('✅ ログアウト完了');
    } catch (error) {
      console.error('❌ ログアウトエラー:', error);
      // エラーでも状態は更新済み（ローカルデータは削除済み）
    }
  }, [optimisticState.token, setLoggedOut]);

  // ===== ユーザー情報更新処理 =====

  /**
   * ユーザー情報を手動で更新
   */
  const updateUser = useCallback(
    (user: User) => {
      // ストレージ更新
      const currentToken = optimisticState.token;
      if (currentToken) {
        authStorage.saveAuthData({ user, token: currentToken });
      }
      // 状態更新
      updateAuthState({ user });
    },
    [optimisticState.token, updateAuthState],
  );

  // ===== Context値の作成 =====

  /**
   * Contextに提供する値
   * メモ化して不要な再レンダリングを防止
   */
  const contextValue: AuthContextType = useMemo(
    () => ({
      ...optimisticState,
      login,
      logout,
      updateUser,
      isTransitioning,
    }),
    [optimisticState, login, logout, updateUser, isTransitioning],
  );

  // ===== レンダリング =====

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
