// apps/frontend/src/components/ui/ErrorDisplay.tsx
// 再利用可能なエラー表示コンポーネント

/**
 * ErrorDisplayコンポーネントのProps
 */
export interface ErrorDisplayProps {
  /** エラーのタイトル */
  title?: string;
  /** エラーメッセージ */
  message: string;
  /** 再試行ボタンを表示するか */
  showRetry?: boolean;
  /** 再試行ボタンクリック時のコールバック */
  onRetry?: () => void;
  /** 全画面表示かどうか */
  fullScreen?: boolean;
  /** エラーの種類 */
  variant?: 'error' | 'warning' | 'info';
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 再利用可能なエラー表示コンポーネント
 *
 * @param props - ErrorDisplayProps
 * @returns React.ReactElement
 *
 * @example
 * ```typescript
 * // 基本的なエラー表示
 * <ErrorDisplay
 *   title="データ読み込みエラー"
 *   message="データの取得に失敗しました"
 *   showRetry
 *   onRetry={() => refetch()}
 * />
 *
 * // 警告表示
 * <ErrorDisplay
 *   variant="warning"
 *   message="一部の機能が利用できません"
 * />
 * ```
 */
export function ErrorDisplay({
  title = 'エラーが発生しました',
  message,
  showRetry = false,
  onRetry,
  fullScreen = false,
  variant = 'error',
  className = '',
}: ErrorDisplayProps): React.ReactElement {
  // バリアント別のスタイル設定
  const variantStyles = {
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-500',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
  };

  const styles = variantStyles[variant];

  // アイコン選択
  const renderIcon = () => {
    switch (variant) {
      case 'warning':
        return (
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>体重・体脂肪率管理アプリアイコン</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>体重・体脂肪率管理アプリアイコン</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default: // error
        return (
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>体重・体脂肪率管理アプリアイコン</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
    }
  };

  const containerClass = fullScreen
    ? 'flex items-center justify-center min-h-screen bg-gray-50 p-4'
    : 'flex items-center justify-center p-4';

  return (
    <div className={`${containerClass} ${className}`}>
      <div
        className={`max-w-md w-full ${styles.bgColor} ${styles.borderColor} border rounded-lg p-8 text-center shadow-lg`}
      >
        {/* アイコン */}
        <div className={`${styles.iconColor} mb-4`}>{renderIcon()}</div>

        {/* タイトル */}
        <h3 className={`text-lg font-semibold ${styles.titleColor} mb-4`}>{title}</h3>

        {/* メッセージ */}
        <p className={`${styles.messageColor} mb-6 leading-relaxed`}>{message}</p>

        {/* 再試行ボタン */}
        {showRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`
              inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md
              ${styles.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2
              transition-colors duration-200
            `}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>体重・体脂肪率管理アプリ再試行アイコン</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            再試行
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * インライン用の小さなエラー表示
 */
export function InlineError({
  message,
  onDismiss,
  className = '',
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}): React.ReactElement {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>体重・体脂肪率管理アプリアイコン</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800">{message}</p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
            >
              <span className="sr-only">閉じる</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>体重・体脂肪率管理アプリアイコン</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
