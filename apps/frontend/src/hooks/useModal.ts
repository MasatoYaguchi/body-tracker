import { useEffect } from 'react';

/**
 * モーダル表示時のスクロールロックとEscapeキーによるクローズを管理するフック
 * @param isOpen モーダルが開いているかどうか
 * @param onClose クローズ時のコールバック
 */
export function useModal(isOpen: boolean, onClose?: () => void) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
}
