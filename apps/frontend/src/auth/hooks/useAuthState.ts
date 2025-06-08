// apps/frontend/src/auth/hooks/useAuthState.ts
// React 19新機能を活用した認証状態管理ロジック

import { useCallback, useOptimistic, useState, useTransition } from 'react';
import { getCurrentUser } from '../services/authApi';
import { authStorage } from '../services/authStorage';
import type { AuthState, StoredAuthData, User } from '../types/auth.types';

/**
 * 認証状態管理フックの戻り値型
 */
export interface UseAuthStateReturn {
  /** 🆕 React 19: 楽観的更新された認証状態 */
  optimisticState: AuthState;
  /** 実際の認証状態 */
  actualState: AuthState;
  /** 🆕 React 19: Transition中かどうか */
  isTransitioning: boolean;
  /** 状態更新関数 */
  updateAuthState: (newState: Partial<AuthState>) => void;
  /** 楽観的状態更新関数 */
  updateOptimisticState: (newState: Partial<AuthState>) => void;
  /** 認証状態初期化関数 */
  initializeAuthState: () => Promise<void>;
  /** ログイン状態設定関数 */
  setLoggedIn: (user: User, token: string) => void;
  /** ログアウト状態設定関数 */
  setLoggedOut: () => void;
  /** ローディング状態制御関数 */
  setLoading: (loading: boolean) => void;
}

/**
 * 🆕 React 19新機能を活用した認証状態管理フック
 *
 * useOptimistic: ログイン/ログアウト処理の楽観的更新
 * useTransition: 認証処理の低優先度実行でUIブロック防止
 *
 * @returns UseAuthStateReturn 状態管理に必要な全ての関数と状態
 *
 * @example
 * ```typescript
 * function AuthProvider({ children }) {
 *   const {
 *     optimisticState,
 *     isTransitioning,
 *     setLoggedIn,
 *     setLoggedOut,
 *     initializeAuthState
 *   } = useAuthState();
 *
 *   useEffect(() => {
 *     initializeAuthState();
 *   }, []);
 *
 *   return (
 *     <AuthContext.Provider value={{
 *       ...optimisticState,
 *       isTransitioning,
 *       login: handleLogin,
 *       logout: handleLogout
 *     }}>
 *       {children}
 *     </AuthContext.Provider>
 *   );
 * }
 * ```
 */
export function useAuthState(): UseAuthStateReturn {
  // ===== 基本状態管理 =====

  /**
   * 実際の認証状態
   * サーバーからの応答を待って更新される確実な状態
   */
  const [actualState, setActualState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // 初期化時はローディング状態
    token: null,
  });

  // ===== React 19新機能: useOptimistic =====

  /**
   * 🆕 React 19: 楽観的更新による即座なUI反映
   *
   * ユーザーの操作に対して即座にUIを更新し、
   * バックグラウンドで実際の処理を行う
   */
  const [optimisticState, setOptimisticState] = useOptimistic(
    actualState,
    (currentState: AuthState, optimisticUpdate: Partial<AuthState>) => ({
      ...currentState,
      ...optimisticUpdate,
    }),
  );

  // ===== React 19新機能: useTransition =====

  /**
   * 🆕 React 19: 非同期処理の低優先度実行
   *
   * 認証処理をバックグラウンドで実行し、
   * UIの応答性を維持する
   */
  const [isTransitioning, startTransition] = useTransition();

  // ===== 状態更新関数 =====

  /**
   * 実際の認証状態を更新
   *
   * @param newState - 更新する状態の一部
   *
   * @example
   * ```typescript
   * updateAuthState({ isLoading: false, user: userData });
   * ```
   */
  const updateAuthState = useCallback((newState: Partial<AuthState>) => {
    setActualState((prev) => ({
      ...prev,
      ...newState,
    }));
  }, []);

  /**
   * 楽観的状態を更新
   *
   * @param newState - 楽観的に更新する状態
   *
   * @example
   * ```typescript
   * // ログインボタンクリック時に即座にローディング表示
   * updateOptimisticState({ isLoading: true });
   * ```
   */
  const updateOptimisticState = useCallback(
    (newState: Partial<AuthState>) => {
      setOptimisticState(newState);
    },
    [setOptimisticState],
  );

  // ===== 認証状態初期化 =====

  /**
   * 保存された認証情報から状態を復元
   *
   * ページリロード時やアプリ起動時に実行される
   * 保存されたトークンの有効性をバックグラウンドで検証
   *
   * @example
   * ```typescript
   * useEffect(() => {
   *   initializeAuthState();
   * }, []);
   * ```
   */
  const initializeAuthState = useCallback(async () => {
    console.log('🔍 認証状態初期化開始...');

    try {
      const storedAuthData: StoredAuthData | null = authStorage.getAuthData();

      if (!storedAuthData) {
        console.log('📭 保存された認証情報なし');
        updateAuthState({ isLoading: false });
        return;
      }

      const { token, user } = storedAuthData;
      console.log('🔍 保存された認証情報を発見:', user.email);

      // 楽観的更新: 即座にログイン状態を表示
      const optimisticLoginState = {
        user,
        isAuthenticated: true,
        token,
        isLoading: false,
      };

      setOptimisticState(optimisticLoginState);

      // 🆕 React 19: バックグラウンドでトークン検証
      startTransition(async () => {
        try {
          // サーバーでトークンの有効性を確認
          const currentUser = await getCurrentUser(token);

          // 検証成功: 実際の状態を更新
          const validatedState = {
            user: currentUser,
            isAuthenticated: true,
            token,
            isLoading: false,
          };

          updateAuthState(validatedState);
          console.log('✅ トークン検証成功:', currentUser.email);
        } catch (error) {
          console.log('❌ トークン無効、ログアウト処理実行:', error);

          // 検証失敗: 保存データを削除してログアウト状態に
          authStorage.clearAll();

          const loggedOutState = {
            user: null,
            isAuthenticated: false,
            token: null,
            isLoading: false,
          };

          // 楽観的状態も実際の状態も更新
          setOptimisticState(loggedOutState);
          updateAuthState(loggedOutState);
        }
      });
    } catch (error) {
      console.error('🔴 認証状態初期化エラー:', error);

      // エラー時は安全にログアウト状態に
      const errorState = {
        user: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
      };

      setOptimisticState(errorState);
      updateAuthState(errorState);
    }
  }, [updateAuthState, setOptimisticState]);

  // ===== 便利な状態設定関数 =====

  /**
   * ログイン成功時の状態設定
   *
   * @param user - ログインしたユーザー情報
   * @param token - 取得したJWTトークン
   *
   * @example
   * ```typescript
   * const handleLogin = async (credential: string) => {
   *   const { user, token } = await authApi.authenticateWithGoogle(credential);
   *   setLoggedIn(user, token);
   * };
   * ```
   */
  const setLoggedIn = useCallback(
    (user: User, token: string) => {
      const loggedInState = {
        user,
        isAuthenticated: true,
        token,
        isLoading: false,
      };

      // ローカルストレージに保存
      authStorage.saveAuthData({ user, token });

      // 楽観的更新と実際の更新の両方を実行
      setOptimisticState(loggedInState);
      updateAuthState(loggedInState);

      console.log('✅ ログイン状態設定完了:', user.email);
    },
    [updateAuthState, setOptimisticState],
  );

  /**
   * ログアウト時の状態設定
   *
   * @example
   * ```typescript
   * const handleLogout = () => {
   *   setLoggedOut();
   *   authStorage.clearAll();
   * };
   * ```
   */
  const setLoggedOut = useCallback(() => {
    const loggedOutState = {
      user: null,
      isAuthenticated: false,
      token: null,
      isLoading: false,
    };

    // ローカルストレージから削除
    authStorage.clearAll();

    // 楽観的更新と実際の更新の両方を実行
    setOptimisticState(loggedOutState);
    updateAuthState(loggedOutState);

    console.log('✅ ログアウト状態設定完了');
  }, [updateAuthState, setOptimisticState]);

  /**
   * ローディング状態の制御
   *
   * @param loading - ローディング状態
   *
   * @example
   * ```typescript
   * const handleLogin = async (credential: string) => {
   *   setLoading(true);
   *   try {
   *     const result = await authApi.authenticateWithGoogle(credential);
   *     setLoggedIn(result.user, result.token);
   *   } finally {
   *     setLoading(false);
   *   }
   * };
   * ```
   */
  const setLoading = useCallback(
    (loading: boolean) => {
      const loadingUpdate = { isLoading: loading };

      // 楽観的更新と実際の更新の両方
      setOptimisticState(loadingUpdate);
      updateAuthState(loadingUpdate);
    },
    [updateAuthState, setOptimisticState],
  );

  // ===== 戻り値 =====

  return {
    optimisticState,
    actualState,
    isTransitioning,
    updateAuthState,
    updateOptimisticState,
    initializeAuthState,
    setLoggedIn,
    setLoggedOut,
    setLoading,
  };
}
