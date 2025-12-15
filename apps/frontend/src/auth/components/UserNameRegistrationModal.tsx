import { useEffect, useState } from 'react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルが開いたときに現在のユーザー名をセット
  useEffect(() => {
    if (isOpen && user?.name) {
      setDisplayName(user.name);
    }
  }, [isOpen, user?.name]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!displayName.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedUser = await updateProfile(token, displayName);
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
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      // biome-ignore lint/a11y/useSemanticElements: Modal implementation using div
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* 背景オーバーレイ */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
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
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                ユーザー名の登録
              </h3>
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
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
          </form>
        </div>
      </div>
    </div>
  );
}
