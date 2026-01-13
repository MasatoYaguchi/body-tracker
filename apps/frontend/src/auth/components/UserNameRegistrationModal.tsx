import { useEffect, useRef, useState } from 'react';
import { InlineSpinner } from '../../ui/LoadingSpinner';
import { updateProfile } from '../services/authApi';
import { useAuth } from '../useAuth';

interface UserNameRegistrationModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function UserNameRegistrationModal({ isOpen, onClose }: UserNameRegistrationModalProps) {
  const { user, token, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [isParticipating, setIsParticipating] = useState(user?.isParticipatingRanking ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // モーダルが開いたときに現在のユーザー名をセット
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.name || '');
      setIsParticipating(user.isParticipatingRanking ?? false);
    }
  }, [isOpen, user]);

  // ダイアログの開閉制御
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!displayName.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }

    // 変更がない場合はAPIを呼ばずに閉じる
    const currentName = user?.name || '';
    const currentParticipating = user?.isParticipatingRanking ?? false;

    if (displayName === currentName && isParticipating === currentParticipating) {
      onClose?.();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedUser = await updateProfile(token, displayName, isParticipating);
      updateUser(updatedUser);
      onClose?.();
    } catch (err) {
      console.error(err);
      setError('プロフィールの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full p-0 backdrop:bg-gray-500 backdrop:bg-opacity-75"
      onCancel={(e) => {
        // ESCキーで閉じられた場合の処理
        if (onClose) {
          onClose();
        } else {
          e.preventDefault();
        }
      }}
    >
      <div className="px-4 pt-5 pb-4 sm:p-6">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>User Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">ユーザー名の登録</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                ランキングや表示に使用するユーザー名を設定してください。
              </p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              ユーザー名
            </label>
            <input
              type="text"
              name="displayName"
              id="displayName"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
              placeholder="例: 筋トレ太郎"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              required
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <div className="mb-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="isParticipating"
                  name="isParticipating"
                  type="checkbox"
                  checked={isParticipating}
                  onChange={(e) => setIsParticipating(e.target.checked)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="isParticipating" className="font-medium text-gray-700">
                  ランキングに参加する
                </label>
                <p className="text-gray-500">
                  チェックを入れると、あなたの記録が集計対象となり、ランキングに表示されます。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <InlineSpinner className="mr-2" />
                  保存中...
                </>
              ) : (
                '保存する'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
