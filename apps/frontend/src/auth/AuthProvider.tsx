// apps/frontend/src/auth/AuthProvider.tsx
// React 19新機能を活用した認証プロバイダー

import {
  createContext,
  useCallback,
  useEffect,
  useOptimistic,
  useState,
  useTransition,
} from 'react';

// 🆕 React 19新機能: useOptimistic - 楽観的更新
// 🆕 React 19新機能: useTransition - 低優先度処理

// ===== 型定義 =====

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  isTransitioning: boolean; // 🆕 React 19: Transition状態
}

// ===== Context作成 =====

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== API関数 =====

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

async function authenticateWithGoogle(credential: string): Promise<{ user: User; token: string }> {
  const response = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credential }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Authentication failed');
  }

  return response.json();
}

async function logoutUser(): Promise<void> {
  const token = localStorage.getItem('authToken');

  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
  }

  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}

async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
}

// ===== AuthProvider コンポーネント =====

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 🆕 React 19新機能: useOptimistic - 楽観的更新
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  const [optimisticAuth, setOptimisticAuth] = useOptimistic(
    authState,
    (state: AuthState, newState: Partial<AuthState>) => ({
      ...state,
      ...newState,
    }),
  );

  // 🆕 React 19新機能: useTransition - 非同期処理の低優先度実行
  const [isTransitioning, startTransition] = useTransition();

  // ===== 初期化処理 =====

  // 🆕 React 19新機能: useCallback の依存配列最適化
  const initializeAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken && storedUser) {
        console.log('🔍 保存された認証情報を確認中...');

        // 楽観的更新: 即座にUIに反映
        setOptimisticAuth({
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          token: storedToken,
          isLoading: false,
        });

        // バックグラウンドでトークン検証
        startTransition(async () => {
          try {
            const currentUser = await getCurrentUser(storedToken);

            // 検証成功: 実際の状態を更新
            setAuthState({
              user: currentUser,
              isAuthenticated: true,
              token: storedToken,
              isLoading: false,
            });

            console.log('✅ 認証状態復元成功:', currentUser.email);
          } catch (error) {
            console.log('❌ トークン無効、ログアウト処理実行');

            // 検証失敗: ログアウト
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');

            setAuthState({
              user: null,
              isAuthenticated: false,
              token: null,
              isLoading: false,
            });
          }
        });
      } else {
        // 保存された認証情報なし
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('🔴 認証初期化エラー:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
      });
    }
  }, [setOptimisticAuth]);

  // コンポーネント初期化時に認証状態復元
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // ===== ログイン処理 =====

  const login = useCallback(
    async (credential: string) => {
      console.log('🚀 Google認証開始...');

      // 楽観的更新: ローディング状態を即座に表示
      setOptimisticAuth({
        isLoading: true,
      });

      try {
        // 🆕 React 19新機能: startTransition で認証処理を低優先度実行
        startTransition(async () => {
          const { user, token } = await authenticateWithGoogle(credential);

          // 認証成功: ローカルストレージに保存
          localStorage.setItem('authToken', token);
          localStorage.setItem('authUser', JSON.stringify(user));

          // 状態更新
          const newState = {
            user,
            isAuthenticated: true,
            token,
            isLoading: false,
          };

          setOptimisticAuth(newState);
          setAuthState(newState);

          console.log('✅ Google認証成功:', user.email);
        });
      } catch (error) {
        console.error('❌ Google認証失敗:', error);

        // エラー状態に戻す
        const errorState = {
          user: null,
          isAuthenticated: false,
          token: null,
          isLoading: false,
        };

        setOptimisticAuth(errorState);
        setAuthState(errorState);

        throw error; // UIでエラーハンドリングするために再throw
      }
    },
    [setOptimisticAuth],
  );

  // ===== ログアウト処理 =====

  const logout = useCallback(async () => {
    console.log('🚪 ログアウト処理開始...');

    // 楽観的更新: 即座にUIからユーザー情報を削除
    const logoutState = {
      user: null,
      isAuthenticated: false,
      token: null,
      isLoading: false,
    };

    setOptimisticAuth(logoutState);

    try {
      // バックグラウンドでサーバー側ログアウト
      startTransition(async () => {
        await logoutUser();
        setAuthState(logoutState);
        console.log('✅ ログアウト完了');
      });
    } catch (error) {
      console.error('❌ ログアウトエラー:', error);
      // エラーでも状態は更新（ローカルデータは削除済み）
      setAuthState(logoutState);
    }
  }, [setOptimisticAuth]);

  // ===== Context値 =====

  const contextValue: AuthContextType = {
    ...optimisticAuth, // 楽観的更新された状態を使用
    login,
    logout,
    isTransitioning, // 🆕 React 19: Transition状態をUIで利用可能
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// ===== Context Export =====

export { AuthContext };
export type { AuthContextType, AuthState, User };
