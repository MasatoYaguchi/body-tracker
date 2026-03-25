import type { ExerciseType } from '@body-tracker/shared';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from '../ui/ConfirmModal';

interface ExerciseTypeManagerProps {
  exerciseTypes: ExerciseType[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ExerciseTypeManager({
  exerciseTypes,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: ExerciseTypeManagerProps): React.ReactElement {
  const [newTypeName, setNewTypeName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useModal(true, onClose);

  // 編集モード開始時にフォーカス
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleAdd = () => {
    if (newTypeName.trim()) {
      onAdd(newTypeName.trim());
      setNewTypeName('');
    }
  };

  const handleStartEdit = (type: ExerciseType) => {
    setEditingId(type.id);
    setEditingName(type.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onUpdate(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      onDelete(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="exercise-type-manager-title"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          {/* 背景オーバーレイ - EscapeはuseModalがdocumentレベルで処理済み */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: useModalがdocumentレベルでEscapeを処理 */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            aria-hidden="true"
            onClick={onClose}
          />
          {/* モーダルコンテンツ */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 id="exercise-type-manager-title" className="text-lg font-semibold text-gray-800">
                運動種目を管理
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="閉じる"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 種目リスト */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {exerciseTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  {editingId === type.id ? (
                    <>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        aria-label="種目名を編集"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        aria-label="保存"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                        aria-label="キャンセル"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-700">{type.name}</span>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(type)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        aria-label="編集"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(type.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        aria-label="削除"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              ))}

              {exerciseTypes.length === 0 && (
                <p className="text-center text-gray-500 py-4">運動種目がありません</p>
              )}
            </div>

            {/* 新規追加フォーム */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="新しい運動種目を追加..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newTypeName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="運動種目を削除"
        message="この運動種目を削除しますか？"
        confirmLabel="削除"
        cancelLabel="キャンセル"
        variant="danger"
      />
    </>,
    document.body,
  );
}
