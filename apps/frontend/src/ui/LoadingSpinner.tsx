// apps/frontend/src/components/ui/LoadingSpinner.tsx
// 再利用可能なローディングスピナーコンポーネント

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
 *
 * @param props - LoadingSpinnerProps
 * @returns React.ReactElement
 *
 * @example
 * ```typescript
 * // 基本的な使用
 * <LoadingSpinner message="読み込み中..." />
 *
 * // 全画面ローディング
 * <LoadingSpinner size="large" message="認証状態を確認中..." fullScreen />
 *
 * // 小さなインライン表示
 * <LoadingSpinner size="small" />
 * ```
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
        {/* The elements with the following roles can be changed to the following elements:<output> */}
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
