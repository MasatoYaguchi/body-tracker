import { useEffect } from 'react';

// モーダルのネスト管理用参照カウント
let modalCount = 0;

/**
 * モーダル表示時のスクロールロックとEscapeキーによるクローズを管理するフック
 * ネストされたモーダルに対応: 全てのモーダルが閉じるまでスクロールロックを維持
 * @param isOpen モーダルが開いているかどうか
 * @param onClose クローズ時のコールバック
 */
export function useModal(isOpen: boolean, onClose?: () => void) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };

    if (isOpen) {
      modalCount++;
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (isOpen) {
        modalCount--;
        document.removeEventListener('keydown', handleEscape);
        // 全てのモーダルが閉じた時のみスクロールロックを解除
        if (modalCount === 0) {
          document.body.style.overflow = 'unset';
        }
      }
    };
  }, [isOpen, onClose]);
}
