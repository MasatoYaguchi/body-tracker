import { useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: ModalProps): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (dialog.open) {
        dialog.close();
        document.body.style.overflow = 'unset';
      }
    }
  }, [isOpen]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Dialog handles keyboard interaction natively
    <dialog
      ref={dialogRef}
      className="backdrop:bg-gray-500/75 rounded-lg bg-white text-left shadow-xl transition-all sm:w-full sm:max-w-lg p-0"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="px-4 pt-5 pb-4 sm:p-6">
        {title && (
          <div className="mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
          </div>
        )}
        <div className="mt-2">{children}</div>
        {footer && (
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
