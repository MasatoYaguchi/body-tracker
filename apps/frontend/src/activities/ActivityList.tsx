import type { ActivityRecord } from '@body-tracker/shared';
import { useState } from 'react';
import { ConfirmModal } from '../ui/ConfirmModal';

interface ActivityListProps {
  activities: ActivityRecord[];
  onEdit: (activity: ActivityRecord) => void;
  onDelete: (id: string) => void;
}

const MEAL_RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: '抑えた', color: 'bg-green-100 text-green-700' },
  2: { label: 'やや抑えた', color: 'bg-green-50 text-green-600' },
  3: { label: '普通', color: 'bg-gray-100 text-gray-700' },
  4: { label: 'やや食べすぎ', color: 'bg-orange-50 text-orange-600' },
  5: { label: '食べすぎ', color: 'bg-red-100 text-red-700' },
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          最近の記録
        </h2>
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>まだ記録がありません</p>
          <p className="text-sm">今日の活動を記録してみましょう</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        最近の記録
      </h2>

      <div className="space-y-3">
        {activities.slice(0, 7).map((activity, index) => {
          const mealRating = activity.mealRating ? MEAL_RATING_LABELS[activity.mealRating] : null;

          const totalExerciseMinutes = activity.exercises.reduce((sum, e) => sum + e.minutes, 0);

          return (
            <div
              key={activity.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 日付 */}
                  <div className="font-medium text-gray-800 mb-2">{formatDate(activity.date)}</div>

                  {/* タグ群 */}
                  <div className="flex flex-wrap gap-2">
                    {/* 運動 */}
                    {activity.exercises.length > 0 ? (
                      activity.exercises.map((exercise, i) => (
                        <span
                          key={`${exercise.exerciseTypeId}-${i}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          {exercise.exerciseType?.name ?? '運動'}
                          {exercise.minutes > 0 && ` ${exercise.minutes}分`}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                        運動なし
                      </span>
                    )}

                    {/* 運動合計（複数ある場合） */}
                    {activity.exercises.length > 1 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                        計{totalExerciseMinutes}分
                      </span>
                    )}

                    {/* 食事評価 */}
                    {mealRating && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mealRating.color}`}
                      >
                        {mealRating.label}
                      </span>
                    )}

                    {/* 間食 */}
                    {activity.hadSnack && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        間食あり
                      </span>
                    )}

                    {/* 飲酒 */}
                    {activity.hadAlcohol && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        飲酒
                      </span>
                    )}
                  </div>

                  {/* メモ */}
                  {activity.notes && <p className="text-sm text-gray-600 mt-2">{activity.notes}</p>}
                </div>

                {/* アクションボタン */}
                <div className="flex gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => onEdit(activity)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
                    onClick={() => handleDeleteClick(activity.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
