/**
 * LoadingSpinnerコンポーネントのProps
 */
export interface LoadingSpinnerProps {
  /** スピナーのサイズ */
  size?: 'small' | 'medium' | 'large';
  /** 表示メッセージ */
  message?: string;
  /** 全画面表示かどうか */
  fullScreen?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 再利用可能なローディングスピナーコンポーネント
 */
export function LoadingSpinner({
  size = 'medium',
  message,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps): React.ReactElement {
  // サイズに応じたクラス設定
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const containerClass = fullScreen
    ? 'flex items-center justify-center min-h-screen bg-gray-50'
    : 'flex items-center justify-center p-4';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="text-center">
        {/* biome-ignore lint/a11y/useSemanticElements: Keeping div for styling consistency */}
        <div
          role="status"
          aria-live="polite"
          className={`animate-spin rounded-full border-b-2 border-primary-500 mx-auto mb-4 ${sizeClasses[size]}`}
          aria-label="読み込み中"
        >
          <span className="sr-only">読み込み中...</span>
        </div>
        {message && <p className={`text-gray-600 ${textSizeClasses[size]}`}>{message}</p>}
      </div>
    </div>
  );
}

/**
 * インライン用の小さなスピナー
 */
export function InlineSpinner({ className = '' }: { className?: string }): React.ReactElement {
  return (
    <div
      className={`animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 ${className}`}
    />
  );
}
