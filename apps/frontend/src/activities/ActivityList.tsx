import type { ActivityRecord } from '@body-tracker/shared';
import { useState } from 'react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ClipboardIcon, DeleteIcon, EditIcon } from '../ui/Icons';

interface ActivityListProps {
  activities: ActivityRecord[];
  onEdit: (activity: ActivityRecord) => void;
  onDelete: (id: string) => void;
}

const MEAL_RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: {
    label: '抑えた',
    color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  },
  2: {
    label: 'やや抑えた',
    color: 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400',
  },
  3: { label: '普通', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  4: {
    label: 'やや食べすぎ',
    color: 'bg-orange-50 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
  },
  5: { label: '食べすぎ', color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' },
};

const ALCOHOL_RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: {
    label: '飲まなかった',
    color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  },
  2: {
    label: '少し飲んだ',
    color: 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400',
  },
  3: { label: '適量', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  4: {
    label: 'やや飲みすぎ',
    color: 'bg-purple-50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
  },
  5: {
    label: '飲みすぎ',
    color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${month}/${day}(${weekday})`;
}

export function ActivityList({
  activities,
  onEdit,
  onDelete,
}: ActivityListProps): React.ReactElement {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      onDelete(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  if (activities.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
          <ClipboardIcon className="w-5 h-5 mr-2 text-success" />
          最近の記録
        </h2>
        <div className="text-center py-8 text-content-secondary">
          <ClipboardIcon className="w-12 h-12 mx-auto mb-3 text-content-muted" />
          <p>まだ記録がありません</p>
          <p className="text-sm">今日の活動を記録してみましょう</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
        <ClipboardIcon className="w-5 h-5 mr-2 text-success" />
        最近の記録
      </h2>

      <div className="space-y-3">
        {activities.slice(0, 7).map((activity) => {
          const mealRating = activity.mealRating ? MEAL_RATING_LABELS[activity.mealRating] : null;
          const alcoholRating = activity.alcoholRating
            ? ALCOHOL_RATING_LABELS[activity.alcoholRating]
            : null;

          const totalExerciseMinutes = activity.exercises.reduce((sum, e) => sum + e.minutes, 0);

          return (
            <div
              key={activity.id}
              className="p-4 bg-surface-secondary rounded-lg hover:bg-border transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 日付 */}
                  <div className="font-medium text-content mb-2">{formatDate(activity.date)}</div>

                  {/* タグ群 */}
                  <div className="flex flex-wrap gap-2">
                    {/* 運動 */}
                    {activity.exercises.length > 0 ? (
                      activity.exercises.map((exercise, i) => (
                        <span
                          key={`${exercise.exerciseTypeId}-${i}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        >
                          {exercise.exerciseType?.name ?? '運動'}
                          {exercise.minutes > 0 && ` ${exercise.minutes}分`}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        運動なし
                      </span>
                    )}

                    {/* 運動合計（複数ある場合） */}
                    {activity.exercises.length > 1 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                        計{totalExerciseMinutes}分
                      </span>
                    )}

                    {/* 食事 */}
                    {mealRating && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mealRating.color}`}
                      >
                        {mealRating.label}
                      </span>
                    )}

                    {/* 間食 */}
                    {activity.hadSnack && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                        間食あり
                      </span>
                    )}

                    {/* 飲酒 */}
                    {alcoholRating && alcoholRating.label !== '飲まなかった' && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alcoholRating.color}`}
                      >
                        {alcoholRating.label}
                      </span>
                    )}
                  </div>

                  {/* メモ */}
                  {activity.notes && (
                    <p className="text-sm text-content-secondary mt-2">{activity.notes}</p>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="flex gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => onEdit(activity)}
                    className="p-1.5 text-content-muted hover:text-info hover:bg-info-light rounded transition-colors"
                    aria-label="編集"
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(activity.id)}
                    className="p-1.5 text-content-muted hover:text-danger hover:bg-danger-light rounded transition-colors"
                    aria-label="削除"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 削除確認モーダル */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="記録を削除"
        message="この記録を削除しますか？"
        confirmLabel="削除"
        cancelLabel="キャンセル"
        variant="danger"
      />
    </div>
  );
}
