// apps/frontend/src/auth/components/GoogleLoginButton.tsx
// React 19新機能を活用したGoogle認証ボタンコンポーネント

import type { CredentialResponse } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
import { useCallback, useId, useState, useTransition } from 'react';
import { getAuthErrorMessage } from '../services/authApi';
import { useAuth } from '../useAuth';

/**
 * GoogleLoginButtonコンポーネントのProps
 */
export interface GoogleLoginButtonProps {
  /** ログイン成功時のコールバック */
  onSuccess?: (user: { id: string; email: string; name?: string }) => void;
  /** ログイン失敗時のコールバック */
  onError?: (error: string) => void;
  /** ボタンのテキスト（デフォルト: "Googleでログイン"） */
  text?: string;
  /** ボタンの形状 */
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  /** ボタンのサイズ */
  size?: 'large' | 'medium' | 'small';
  /** ボタンのテーマ */
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  /** ボタンの幅（ピクセル） */
  width?: number;
  /** ローディング中の無効化 */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 🆕 React 19新機能を活用したGoogle認証ボタンコンポーネント
 *
 * React 19新機能:
 * - useId: ボタン要素の一意ID生成
 * - useTransition: ログイン処理の非ブロッキング実行
 * - Error Boundary連携: エラーハンドリングの改善
 *
 * @param props - GoogleLoginButtonProps
 * @returns React.ReactElement
 *
 * @example
 * ```typescript
 * // 基本的な使用
 * <GoogleLoginButton
 *   onSuccess={(user) => console.log('Welcome', user.name)}
 *   onError={(error) => showNotification(error)}
 * />
 *
 * // カスタマイズされた使用
 * <GoogleLoginButton
 *   text="Sign in with Google"
 *   theme="filled_blue"
 *   size="large"
 *   shape="pill"
 *   width={400}
 *   onSuccess={handleLoginSuccess}
 *   onError={handleLoginError}
 * />
 * ```
 */
export function GoogleLoginButton({
  onSuccess,
  onError,
  text = 'Googleでログイン',
  shape = 'rectangular',
  size = 'large',
  theme = 'filled_blue',
  width = 320,
  disabled = false,
  className = '',
}: GoogleLoginButtonProps): React.ReactElement {
  // ===== React 19新機能: useId =====

  /**
   * 🆕 React 19: ボタン要素の一意ID生成
   * 複数のログインボタンが存在する場合でも一意性を保証
   */
  const buttonId = useId();
  const errorId = useId();
  const loadingId = useId();

  // ===== React 19新機能: useTransition =====

  /**
   * 🆕 React 19: ログイン処理の低優先度実行
   * UIをブロックせずにスムーズな認証体験を提供
   */
  const [isPending, startTransition] = useTransition();

  // ===== 状態管理 =====

  const { login, isAuthenticated, isTransitioning } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  // ===== イベントハンドラー =====

  /**
   * Google認証成功時の処理
   *
   * @param credentialResponse - Google認証レスポンス
   *
   * 🆕 React 19: startTransitionで非ブロッキング処理
   */
  const handleGoogleSuccess = useCallback(
    (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential) {
        const errorMessage = 'Google認証情報が取得できませんでした';
        setLocalError(errorMessage);
        onError?.(errorMessage);
        return;
      }

      console.log('🎉 Google認証成功、ログイン処理開始...');

      // 🆕 React 19: Transitionで認証処理を低優先度実行
      startTransition(async () => {
        try {
          // ローカルエラーをクリア
          setLocalError(null);

          if (!credentialResponse.credential) {
            const errorMessage = '認証情報が取得できませんでした。再度お試しください。';
            setLocalError(errorMessage);
            onError?.(errorMessage);
            return;
          }
          console.log('🆕 React 19: ログイン処理を非ブロッキングで実行');
          // 認証プロバイダーのログイン処理を実行
          await login(credentialResponse.credential);

          // 成功コールバックを実行（ユーザー情報は認証プロバイダーから取得）
          const authState = useAuth();
          if (authState.user) {
            onSuccess?.(authState.user);
          }

          console.log('✅ ログイン処理完了');
        } catch (error) {
          console.error('❌ ログイン処理失敗:', error);

          // ユーザーフレンドリーなエラーメッセージを生成
          const errorMessage = getAuthErrorMessage(error);
          setLocalError(errorMessage);
          onError?.(errorMessage);
        }
      });
    },
    [login, onSuccess, onError],
  );

  /**
   * Google認証失敗時の処理
   *
   * @example
   * ユーザーがログインをキャンセルした場合など
   */
  const handleGoogleError = useCallback(() => {
    console.log('❌ Google認証が失敗またはキャンセルされました');

    const errorMessage = 'Google認証が失敗しました。再度お試しください。';
    setLocalError(errorMessage);
    onError?.(errorMessage);
  }, [onError]);

  /**
   * エラーメッセージをクリア
   */
  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  // ===== レンダリング制御 =====

  /**
   * 既にログイン済みの場合は何も表示しない
   */
  if (isAuthenticated) {
    return <></>;
  }

  /**
   * ボタンが無効かどうか判定
   *
   * 🆕 React 19: 複数のTransition状態を統合
   */
  const isButtonDisabled = disabled || isPending || isTransitioning;

  // ===== JSX レンダリング =====

  return (
    <div className={`google-login-container ${className}`}>
      {/* エラーメッセージ表示 */}
      {localError && (
        <div
          id={errorId}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-up"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{localError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="ml-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg focus:ring-2 focus:ring-red-600 p-1.5 hover:bg-red-100 inline-flex h-8 w-8"
              aria-label="エラーメッセージを閉じる"
            >
              <span className="sr-only">閉じる</span>
              <svg className="w-3 h-3" aria-hidden="true" fill="none" viewBox="0 0 14 14">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ローディング状態表示 */}
      {isButtonDisabled && (
        <div
          id={loadingId}
          className="mb-4 flex items-center justify-center p-2 text-sm text-gray-600"
          aria-live="polite"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2" />
          {isPending ? 'ログイン処理中...' : 'しばらくお待ちください...'}
        </div>
      )}

      {/* Google認証ボタン */}
      <div
        id={buttonId}
        className={`transition-opacity duration-200 ${
          isButtonDisabled ? 'opacity-50 pointer-events-none' : 'opacity-100'
        }`}
      >
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          text={text as any}
          shape={shape}
          size={size}
          theme={theme}
          width={width}
          useOneTap={false} // ワンタップログインは無効（明示的なクリックを要求）
          auto_select={false} // 自動選択も無効
          cancel_on_tap_outside={true} // 外部クリックでキャンセル可能
        />
      </div>

      {/* アクセシビリティ: スクリーンリーダー用説明 */}
      <div className="sr-only">
        <p id={`${buttonId}-description`}>
          Googleアカウントでログインします。新しいタブまたはポップアップでGoogle認証画面が開きます。
        </p>
        {isButtonDisabled && <p>現在ログイン処理中です。しばらくお待ちください。</p>}
      </div>
    </div>
  );
}

/**
 * 軽量版GoogleLoginButton（最小限の機能）
 *
 * 基本的なGoogle認証のみを提供する軽量コンポーネント
 * カスタムUIが不要な場合に使用
 */
export function SimpleGoogleLoginButton(): React.ReactElement {
  const { login } = useAuth();
  const [isPending, startTransition] = useTransition();

  const handleSuccess = useCallback(
    (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential) return;

      startTransition(async () => {
        try {
          if (!credentialResponse.credential) return;
          await login(credentialResponse.credential);
        } catch (error) {
          console.error('Login failed:', error);
        }
      });
    },
    [login],
  );

  return (
    <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
      <GoogleLogin onSuccess={handleSuccess} onError={() => console.log('Login Failed')} />
    </div>
  );
}

/**
 * Google認証ボタンのプリセットテーマ
 */
export const GoogleLoginPresets = {
  /** 標準的なログインボタン */
  default: {
    theme: 'filled_blue' as const,
    size: 'large' as const,
    shape: 'rectangular' as const,
    width: 320,
    text: 'Googleでログイン',
  },

  /** コンパクトなサインインボタン */
  compact: {
    theme: 'outline' as const,
    size: 'medium' as const,
    shape: 'pill' as const,
    width: 240,
    text: 'Sign in',
  },

  /** ダークテーマ用ボタン */
  dark: {
    theme: 'filled_black' as const,
    size: 'large' as const,
    shape: 'rectangular' as const,
    width: 320,
    text: 'Continue with Google',
  },
} as const;
