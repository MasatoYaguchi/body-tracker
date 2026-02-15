// apps/frontend/src/components/layout/UserHeader.tsx
// ユーザー情報表示・ログアウト機能付きヘッダーコンポーネント

import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { InlineSpinner } from '../ui/LoadingSpinner';

/**
 * UserHeaderコンポーネントのProps
 */
export interface UserHeaderProps {
  /** ログアウト成功時のコールバック */
  onLogoutSuccess?: () => void;
  /** ログアウト失敗時のコールバック */
  onLogoutError?: (error: string) => void;
  /** ヘッダーの背景色を変更 */
  variant?: 'default' | 'transparent';
  /** プロフィールクリック時のハンドラ */
  onProfileClick?: () => void;
}

/**
 * ユーザー情報表示・ログアウト機能付きヘッダーコンポーネント
 *
 * @param props - UserHeaderProps
 * @returns React.ReactElement
 *
 * @example
 * ```typescript
 * <UserHeader
 *   onLogoutSuccess={() => navigate('/login')}
 *   onLogoutError={(error) => showNotification(error)}
 * />
 * ```
 */
export function UserHeader({
  onLogoutSuccess,
  onLogoutError,
  variant = 'default',
  onProfileClick,
}: UserHeaderProps): React.ReactElement {
  const { user, logout, isTransitioning } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 現在のパスに基づいてアクティブなタブを判定
  const isCurrentPath = (path: string) => location.pathname === path;

  /**
   * ログアウト処理
   */
  const handleLogout = useCallback(async () => {
    if (isLoggingOut || isTransitioning) return;

    setIsLoggingOut(true);

    try {
      await logout();
      console.log('✅ ログアウト成功');
      onLogoutSuccess?.();
    } catch (error) {
      console.error('❌ ログアウト失敗:', error);
      const errorMessage = error instanceof Error ? error.message : 'ログアウトに失敗しました';
      onLogoutError?.(errorMessage);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, isTransitioning, isLoggingOut, onLogoutSuccess, onLogoutError]);

  const isProcessing = isLoggingOut || isTransitioning;

  const headerBgClass = variant === 'transparent' ? 'bg-white/80 backdrop-blur-sm' : 'bg-white';

  return (
    <header className={`${headerBgClass} border-b border-gray-200 shadow-sm sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* アプリロゴ・タイトル・ナビゲーション */}
          <div className="flex items-center relative">
            <button
              type="button"
              className="flex items-center focus:outline-none group"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 text-primary-600">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <title>体重・体脂肪率管理アプリロゴ</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3 hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  体重・体脂肪率管理
                </h1>
              </div>
              <div className="ml-1 sm:hidden">
                <h1 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  体重管理
                </h1>
              </div>
              <svg
                className={`ml-1 h-5 w-5 text-gray-500 transform transition-transform ${
                  isMenuOpen ? 'rotate-180' : ''
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <title>Chevron Down</title>
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* ドロップダウンメニュー */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsMenuOpen(false);
                  }}
                  aria-hidden="true"
                />
                <div className="absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1">
                  <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isCurrentPath('/')
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ダッシュボード 📊
                  </Link>
                  <Link
                    to="/ranking"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isCurrentPath('/ranking')
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ランキング 🏆
                  </Link>
                </div>
              </>
            )}

            {/* ナビゲーション (デスクトップ) */}
            <nav className="hidden md:ml-8 md:flex md:space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isCurrentPath('/')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                ダッシュボード 📊
              </Link>
              <Link
                to="/ranking"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isCurrentPath('/ranking')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                ランキング 🏆
              </Link>
            </nav>
          </div>

          {/* ユーザー情報・ログアウト */}
          <div className="flex items-center space-x-4">
            {!user ? (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                ログイン
              </Link>
            ) : (
              <>
                {/* ユーザープロフィール */}
                <button
                  type="button"
                  onClick={onProfileClick}
                  className="flex items-center space-x-3 hover:bg-gray-50 rounded-full py-1 px-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="プロフィール設定を開く"
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || user.email}
                      className="h-8 w-8 rounded-full border-2 border-gray-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>ユーザーアバター</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'ユーザー'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-48">{user?.email}</p>
                  </div>
                </button>

                {/* ログアウトボタン */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isProcessing}
                  className={`
                inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
              `}
                  aria-label="ログアウト"
                >
                  {isProcessing && <InlineSpinner className="mr-2" />}
                  <span className="hidden sm:inline">
                    {isProcessing ? 'ログアウト中...' : 'ログアウト'}
                  </span>
                  <span className="sm:hidden">{isProcessing ? '...' : 'ログアウト'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* モバイル用ナビゲーション (画面幅が狭い場合のみ表示) */}
        <div className="md:hidden border-t border-gray-200 py-2 flex justify-around">
          <Link
            to="/"
            className={`flex-1 py-2 text-center text-sm font-medium ${
              isCurrentPath('/') ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            ダッシュボード 📊
          </Link>
          <Link
            to="/ranking"
            className={`flex-1 py-2 text-center text-sm font-medium ${
              isCurrentPath('/ranking') ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            ランキング 🏆
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * 軽量版ユーザーヘッダー（モバイル向け）
 */
export function CompactUserHeader(): React.ReactElement {
  const { user, logout, isTransitioning } = useAuth();

  const handleQuickLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Quick logout failed:', error);
    }
  }, [logout]);

  return (
    <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-2">
        {user?.picture && (
          <img src={user.picture} alt={user.name || user.email} className="h-6 w-6 rounded-full" />
        )}
        <span className="text-sm font-medium text-gray-900 truncate">
          {user?.name || user?.email}
        </span>
      </div>

      <button
        type="button"
        onClick={handleQuickLogout}
        disabled={isTransitioning}
        className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
      >
        {isTransitioning ? '...' : 'ログアウト'}
      </button>
    </div>
  );
}
