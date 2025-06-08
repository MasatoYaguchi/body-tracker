// apps/frontend/src/auth/providers/AuthContext.tsx
// React 19新機能を活用した認証Context定義

import { createContext } from 'react';
import type { AuthContextType } from '../types/auth.types';

/**
 * 認証Context
 *
 * アプリケーション全体で認証状態と認証関連の操作を共有するためのContext
 *
 * 🆕 React 19新機能:
 * - Context値の型安全性向上
 * - useOptimistic状態の統合サポート
 * - Suspenseとの自然な連携
 *
 * @example
 * ```typescript
 * // Provider側
 * <AuthContext.Provider value={authContextValue}>
 *   <App />
 * </AuthContext.Provider>
 *
 * // Consumer側
 * const auth = useContext(AuthContext);
 * if (!auth) {
 *   throw new Error('useAuth must be used within AuthProvider');
 * }
 * ```
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthContext の display name 設定
 *
 * React DevToolsでの識別を容易にする
 * デバッグ時にコンポーネントツリーで "AuthContext" として表示
 */
AuthContext.displayName = 'AuthContext';

/**
 * Context Provider コンポーネントの型定義
 *
 * AuthProviderコンポーネントで使用するProps型
 *
 * @example
 * ```typescript
 * const AuthProvider: FC<AuthContextProviderProps> = ({ children, value }) => {
 *   return (
 *     <AuthContext.Provider value={value}>
 *       {children}
 *     </AuthContext.Provider>
 *   );
 * };
 * ```
 */
export interface AuthContextProviderProps {
  /** 子コンポーネント */
  children: React.ReactNode;
  /** Context に提供する値 */
  value: AuthContextType;
}

/**
 * 型安全なContext値検証ヘルパー
 *
 * Contextの値がundefinedでないことを保証し、型安全にアクセスできる
 *
 * @param contextValue - Context から取得した値
 * @returns 検証済みのContext値
 * @throws {Error} Context が Provider の外で使用された場合
 *
 * @example
 * ```typescript
 * function useAuth() {
 *   const context = useContext(AuthContext);
 *   return validateAuthContext(context);
 * }
 * ```
 */
export function validateAuthContext(contextValue: AuthContextType | undefined): AuthContextType {
  if (contextValue === undefined) {
    throw new Error(
      'AuthContext is undefined. ' +
        'Make sure you are using useAuth within an AuthProvider. ' +
        'Common causes: ' +
        '1. Component is outside of AuthProvider ' +
        '2. AuthProvider is not properly configured ' +
        '3. Context value is not set correctly',
    );
  }

  return contextValue;
}

/**
 * デバッグ用: Context状態の文字列表現を生成
 *
 * @param context - AuthContext の値
 * @returns デバッグ用の状態文字列
 *
 * @example
 * ```typescript
 * const context = useContext(AuthContext);
 * console.log('Auth state:', getAuthContextDebugInfo(context));
 * // Output: "Auth state: authenticated(user@example.com) loading(false) transitioning(true)"
 * ```
 */
export function getAuthContextDebugInfo(context: AuthContextType | undefined): string {
  if (!context) {
    return 'Context: undefined (not within AuthProvider)';
  }

  const { isAuthenticated, isLoading, isTransitioning, user } = context;

  const parts = [
    `authenticated(${isAuthenticated})`,
    `loading(${isLoading})`,
    `transitioning(${isTransitioning})`,
    user ? `user(${user.email})` : 'user(none)',
  ];

  return `Context: ${parts.join(' ')}`;
}

/**
 * React 19 Suspense 用のエラーバウンダリヘルパー
 *
 * 🆕 React 19新機能: Suspenseとエラーバウンダリの統合改善
 *
 * 認証関連のエラーを適切にキャッチして、
 * ユーザーフレンドリーなエラー表示に変換
 *
 * @param error - キャッチされたエラー
 * @returns ユーザー向けエラーメッセージ
 *
 * @example
 * ```typescript
 * // ErrorBoundary コンポーネント内で使用
 * static getDerivedStateFromError(error: Error) {
 *   const userMessage = getAuthErrorBoundaryMessage(error);
 *   return { hasError: true, errorMessage: userMessage };
 * }
 * ```
 */
export function getAuthErrorBoundaryMessage(error: Error): string {
  // AuthContext関連のエラー
  if (error.message.includes('AuthContext is undefined')) {
    return '認証システムの初期化中にエラーが発生しました。ページを再読み込みしてください。';
  }

  // 認証が必要なエラー
  if (error.message.includes('Authentication required')) {
    return 'この機能を使用するにはログインが必要です。';
  }

  // その他の認証エラー
  if (error.name === 'AuthenticationError') {
    return '認証エラーが発生しました。再度ログインしてください。';
  }

  // 一般的なエラー
  return '予期しないエラーが発生しました。しばらく待ってから再度お試しください。';
}

/**
 * Context値の型ガード
 *
 * 実行時にContext値が正しい型かどうかをチェック
 *
 * @param value - チェック対象の値
 * @returns AuthContextType の場合 true
 *
 * @example
 * ```typescript
 * const contextValue = useContext(AuthContext);
 * if (isAuthContextType(contextValue)) {
 *   // 型安全にアクセス可能
 *   console.log(contextValue.user?.email);
 * }
 * ```
 */
export function isAuthContextType(value: unknown): value is AuthContextType {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AuthContextType).isAuthenticated === 'boolean' &&
    typeof (value as AuthContextType).isLoading === 'boolean' &&
    typeof (value as AuthContextType).isTransitioning === 'boolean' &&
    typeof (value as AuthContextType).login === 'function' &&
    typeof (value as AuthContextType).logout === 'function'
  );
}
