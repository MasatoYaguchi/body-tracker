import type { ActivityRecord, ExerciseType } from '@body-tracker/shared';
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ActivityForm } from './ActivityForm';
import { ActivityList } from './ActivityList';
import { ActivityStatsChart } from './ActivityStatsChart';
import { ExerciseTypeManager } from './ExerciseTypeManager';

// ダミーデータ: 運動種目
const INITIAL_EXERCISE_TYPES: ExerciseType[] = [
  { id: '1', name: 'ウォーキング', sortOrder: 1 },
  { id: '2', name: 'ランニング', sortOrder: 2 },
  { id: '3', name: '筋トレ', sortOrder: 3 },
  { id: '4', name: 'ストレッチ', sortOrder: 4 },
];

// ダミーデータ: 活動記録（過去7日分）
function generateDummyActivities(exerciseTypes: ExerciseType[]): ActivityRecord[] {
  const today = new Date();
  const activities: ActivityRecord[] = [];

  // 過去7日分のダミーデータ
  const dummyData = [
    {
      daysAgo: 0,
      exercises: [{ typeIndex: 0, minutes: 30 }],
      mealRating: 3,
      hadSnack: false,
      alcoholRating: 1,
      notes: '朝のウォーキング',
    },
    {
      daysAgo: 1,
      exercises: [
        { typeIndex: 2, minutes: 45 },
        { typeIndex: 3, minutes: 15 },
      ],
      mealRating: 4,
      hadSnack: true,
      alcoholRating: 4,
      notes: 'ジムで筋トレ+ストレッチ。夜に飲み会',
    },
    {
      daysAgo: 2,
      exercises: [],
      mealRating: 2,
      hadSnack: true,
      alcoholRating: 1,
      notes: '雨で運動できず',
    },
    {
      daysAgo: 3,
      exercises: [{ typeIndex: 1, minutes: 40 }],
      mealRating: 3,
      hadSnack: false,
      alcoholRating: 1,
      notes: '夕方にランニング',
    },
    {
      daysAgo: 4,
      exercises: [
        { typeIndex: 0, minutes: 45 },
        { typeIndex: 2, minutes: 30 },
      ],
      mealRating: 2,
      hadSnack: false,
      alcoholRating: 2,
      notes: '',
    },
    {
      daysAgo: 5,
      exercises: [],
      mealRating: 5,
      hadSnack: true,
      alcoholRating: 5,
      notes: '休日でだらけた',
    },
    {
      daysAgo: 6,
      exercises: [{ typeIndex: 3, minutes: 20 }],
      mealRating: 3,
      hadSnack: false,
      alcoholRating: 3,
      notes: '軽くストレッチ',
    },
  ];

  for (const data of dummyData) {
    const date = new Date(today);
    date.setDate(date.getDate() - data.daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    activities.push({
      id: `dummy-${data.daysAgo}`,
      date: dateStr,
      exercises: data.exercises.map((e) => ({
        exerciseTypeId: exerciseTypes[e.typeIndex].id,
        exerciseType: exerciseTypes[e.typeIndex],
        minutes: e.minutes,
      })),
      mealRating: data.mealRating,
      hadSnack: data.hadSnack,
      alcoholRating: data.alcoholRating,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
  }

  return activities;
}

export function ActivitiesPage(): React.ReactElement {
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>(INITIAL_EXERCISE_TYPES);
  const [activities, setActivities] = useState<ActivityRecord[]>(() =>
    generateDummyActivities(INITIAL_EXERCISE_TYPES),
  );
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [showExerciseTypeManager, setShowExerciseTypeManager] = useState(false);

  // 活動記録の追加
  const handleAddActivity = (data: Omit<ActivityRecord, 'id' | 'createdAt'>) => {
    const newActivity: ActivityRecord = {
      ...data,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
    };
    setActivities([newActivity, ...activities]);
  };

  // 活動記録の更新
  const handleUpdateActivity = (data: Omit<ActivityRecord, 'id' | 'createdAt'>) => {
    if (!editingActivity) return;
    const updated: ActivityRecord = {
      ...data,
      id: editingActivity.id,
      createdAt: editingActivity.createdAt,
    };
    setActivities(activities.map((a) => (a.id === editingActivity.id ? updated : a)));
    setEditingActivity(null);
  };

  // 活動記録の削除
  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter((a) => a.id !== id));
    setEditingActivity(null);
  };

  // 運動種目の追加
  const handleAddExerciseType = (name: string) => {
    const newType: ExerciseType = {
      id: String(Date.now()),
      name,
      sortOrder: exerciseTypes.length + 1,
    };
    setExerciseTypes([...exerciseTypes, newType]);
  };

  // 運動種目の更新
  const handleUpdateExerciseType = (id: string, name: string) => {
    setExerciseTypes(exerciseTypes.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  // 運動種目の削除
  const handleDeleteExerciseType = (id: string) => {
    setExerciseTypes(exerciseTypes.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <svg
            className="w-7 h-7 mr-3 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          活動記録
        </h1>
        <p className="text-gray-600 mt-2">
          運動・食事・生活習慣を記録して、体重との相関を確認しましょう
        </p>
      </div>

      {/* メインコンテンツ（フォームと一覧を上に配置） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 入力フォーム（新規作成専用） */}
        <ActivityForm
          exerciseTypes={exerciseTypes}
          onSubmit={handleAddActivity}
          onManageExerciseTypes={() => setShowExerciseTypeManager(true)}
        />

        {/* 記録一覧 */}
        <ActivityList
          activities={activities}
          onEdit={setEditingActivity}
          onDelete={handleDeleteActivity}
        />
      </div>

      {/* 統計グラフ（下に配置） */}
      <ActivityStatsChart activities={activities} />

      {/* 編集モーダル */}
      <Modal
        isOpen={!!editingActivity}
        onClose={() => setEditingActivity(null)}
        title="記録を編集"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                if (editingActivity) {
                  handleDeleteActivity(editingActivity.id);
                }
              }}
              className="px-4 py-2 text-danger hover:bg-danger-light rounded-lg transition-colors"
            >
              削除
            </button>
            <button
              type="button"
              onClick={() => setEditingActivity(null)}
              className="px-4 py-2 border border-border text-content-secondary rounded-lg hover:bg-surface-secondary transition-colors"
            >
              キャンセル
            </button>
          </>
        }
      >
        {editingActivity && (
          <ActivityForm
            exerciseTypes={exerciseTypes}
            onSubmit={handleUpdateActivity}
            initialValues={editingActivity}
            isEditing={true}
            onManageExerciseTypes={() => setShowExerciseTypeManager(true)}
          />
        )}
      </Modal>

      {/* 運動種目管理モーダル */}
      {showExerciseTypeManager && (
        <ExerciseTypeManager
          exerciseTypes={exerciseTypes}
          onAdd={handleAddExerciseType}
          onUpdate={handleUpdateExerciseType}
          onDelete={handleDeleteExerciseType}
          onClose={() => setShowExerciseTypeManager(false)}
        />
      )}
    </div>
  );
}
