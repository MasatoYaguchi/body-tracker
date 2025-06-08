// apps/frontend/src/components/layout/LoginScreen.tsx
// 🆕 React 19新機能を活用したログイン画面コンポーネント

import { Suspense, useCallback } from 'react';

import { GoogleLoginButton } from '../auth/components/GoogleLoginButton';
import { LoadingSpinner } from '../ui/LoadingSpinner';

/**
 * LoginScreenコンポーネントのProps
 */
export interface LoginScreenProps {
  /** ログイン成功時のコールバック */
  onLoginSuccess?: (user: { email: string; name?: string }) => void;
  /** ログイン失敗時のコールバック */
  onLoginError?: (error: string) => void;
}

/**
 * 🆕 React 19新機能を活用したログイン画面コンポーネント
 *
 * React 19新機能:
 * - Suspense: Google認証ライブラリの遅延読み込み
 * - useId: フォーム要素の一意ID生成
 *
 * @param props - LoginScreenProps
 * @returns React.ReactElement
 *
 * @example
 * ```typescript
 * <LoginScreen
 *   onLoginSuccess={(user) => console.log('Welcome', user.name)}
 *   onLoginError={(error) => showNotification(error)}
 * />
 * ```
 */
export function LoginScreen({
  onLoginSuccess,
  onLoginError,
}: LoginScreenProps): React.ReactElement {
  /**
   * ログイン成功ハンドラー
   */
  const handleLoginSuccess = useCallback(
    (user: { email: string; name?: string }) => {
      console.log('✅ ログイン成功:', user.email);
      onLoginSuccess?.(user);
    },
    [onLoginSuccess],
  );

  /**
   * ログイン失敗ハンドラー
   */
  const handleLoginError = useCallback(
    (error: string) => {
      console.error('❌ ログイン失敗:', error);
      onLoginError?.(error);
    },
    [onLoginError],
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* ヘッダーセクション */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-primary-600 mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>体重・体脂肪率管理アプリアイコン</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">体重・体脂肪率管理</h1>
          <p className="text-lg text-gray-600 mb-8">健康な毎日をサポート</p>
        </div>

        {/* ログインカード */}
        <div className="bg-white py-8 px-4 shadow-card sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">ログイン</h2>
              <p className="text-sm text-gray-600 mb-8">
                Googleアカウントでログインして、体重・体脂肪率の記録を開始しましょう
              </p>
            </div>

            {/* Google認証ボタン */}
            <div className="flex justify-center">
              <Suspense
                fallback={<LoadingSpinner size="medium" message="認証システム読み込み中..." />}
              >
                <GoogleLoginButton
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                  text="Googleでログイン"
                  theme="filled_blue"
                  size="large"
                  shape="rectangular"
                  width={320}
                />
              </Suspense>
            </div>

            {/* 利用規約 */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                ログインすることで、
                <a
                  // biome-ignore lint/a11y/useValidAnchor: <explanation>
                  href="#"
                  className="text-primary-600 hover:text-primary-500 underline"
                >
                  利用規約
                </a>
                および
                <a
                  // biome-ignore lint/a11y/useValidAnchor: <explanation>
                  href="#"
                  className="text-primary-600 hover:text-primary-500 underline"
                >
                  プライバシーポリシー
                </a>
                に同意したものとみなされます。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 機能説明セクション */}
      <FeatureHighlights />
    </div>
  );
}

/**
 * 機能説明セクションコンポーネント
 */
function FeatureHighlights(): React.ReactElement {
  const features = [
    {
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>体重・体脂肪率管理アプリデータ記録</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: 'データ記録',
      description: '体重と体脂肪率を簡単に記録・管理',
    },
    {
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>体重・体脂肪率管理アプリ統計分析</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      title: '統計分析',
      description: '変化の傾向を可視化して健康管理をサポート',
    },
    {
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>体重・体脂肪率管理アプリセキュアアイコン</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      title: 'セキュア',
      description: 'Google認証による安全なデータ管理',
    },
  ];

  return (
    <div className="mt-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={`${feature.title}_${index}`} className="text-center">
            <div className="mx-auto h-12 w-12 text-primary-600 mb-4">{feature.icon}</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
