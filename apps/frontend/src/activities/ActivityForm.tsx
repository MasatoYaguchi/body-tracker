import type { ActivityRecord, ExerciseEntry, ExerciseType } from '@body-tracker/shared';
import { useEffect, useState } from 'react';

interface ActivityFormProps {
  exerciseTypes: ExerciseType[];
  onSubmit: (data: Omit<ActivityRecord, 'id' | 'createdAt'>) => void;
  initialValues?: ActivityRecord;
  isEditing?: boolean;
  onCancel?: () => void;
  onManageExerciseTypes?: () => void;
}

const MEAL_RATINGS = [
  { value: 1, label: '抑えた', color: 'bg-green-100 text-green-700' },
  { value: 2, label: 'やや抑えた', color: 'bg-green-50 text-green-600' },
  { value: 3, label: '普通', color: 'bg-gray-100 text-gray-700' },
  { value: 4, label: 'やや食べすぎ', color: 'bg-orange-50 text-orange-600' },
  { value: 5, label: '食べすぎ', color: 'bg-red-100 text-red-700' },
];

interface ExerciseFormEntry {
  id: string; // フォーム内での一意識別用
  exerciseTypeId: string;
  minutes: number;
}

export function ActivityForm({
  exerciseTypes,
  onSubmit,
  initialValues,
  isEditing = false,
  onCancel,
  onManageExerciseTypes,
}: ActivityFormProps): React.ReactElement {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(initialValues?.date ?? today);
  const [exercises, setExercises] = useState<ExerciseFormEntry[]>(() => {
    if (initialValues?.exercises && initialValues.exercises.length > 0) {
      return initialValues.exercises.map((e, i) => ({
        id: `${i}`,
        exerciseTypeId: e.exerciseTypeId,
        minutes: e.minutes,
      }));
    }
    return [];
  });
  const [mealRating, setMealRating] = useState(initialValues?.mealRating ?? 3);
  const [hadSnack, setHadSnack] = useState(initialValues?.hadSnack ?? false);
  const [hadAlcohol, setHadAlcohol] = useState(initialValues?.hadAlcohol ?? false);
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  // initialValuesが変わったらフォームをリセット
  useEffect(() => {
    if (initialValues) {
      setDate(initialValues.date);
      setExercises(
        initialValues.exercises.map((e, i) => ({
          id: `${i}`,
          exerciseTypeId: e.exerciseTypeId,
          minutes: e.minutes,
        })),
      );
      setMealRating(initialValues.mealRating ?? 3);
      setHadSnack(initialValues.hadSnack);
      setHadAlcohol(initialValues.hadAlcohol);
      setNotes(initialValues.notes ?? '');
    } else {
      setDate(today);
      setExercises([]);
      setMealRating(3);
      setHadSnack(false);
      setHadAlcohol(false);
      setNotes('');
    }
  }, [initialValues, today]);

  const addExercise = () => {
    setExercises([...exercises, { id: `${Date.now()}`, exerciseTypeId: '', minutes: 30 }]);
  };

  const updateExercise = (
    id: string,
    field: 'exerciseTypeId' | 'minutes',
    value: string | number,
  ) => {
    setExercises(exercises.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((e) => e.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validExercises: ExerciseEntry[] = exercises
      .filter((e) => e.exerciseTypeId && e.minutes > 0)
      .map((e) => ({
        exerciseTypeId: e.exerciseTypeId,
        minutes: e.minutes,
        exerciseType: exerciseTypes.find((t) => t.id === e.exerciseTypeId),
      }));

    onSubmit({
      date,
      exercises: validExercises,
      mealRating,
      hadSnack,
      hadAlcohol,
      notes: notes || undefined,
    });

    // 新規追加時のみリセット
    if (!isEditing) {
      setDate(today);
      setExercises([]);
      setMealRating(3);
      setHadSnack(false);
      setHadAlcohol(false);
      setNotes('');
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <title>記録</title>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {isEditing ? '記録を編集' : '今日の活動を記録'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 日付 */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            日付
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* 運動セクション */}
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">運動</span>
            <div className="flex gap-2">
              {onManageExerciseTypes && (
                <button
                  type="button"
                  onClick={onManageExerciseTypes}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  種目を編集
                </button>
              )}
            </div>
          </div>

          {/* 運動リスト */}
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div key={exercise.id} className="flex items-center gap-2 bg-white p-2 rounded-lg">
                <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                <select
                  value={exercise.exerciseTypeId}
                  onChange={(e) => updateExercise(exercise.id, 'exerciseTypeId', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label={`運動種目 ${index + 1}`}
                >
                  <option value="">選択</option>
                  {exerciseTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={exercise.minutes}
                  onChange={(e) => updateExercise(exercise.id, 'minutes', Number(e.target.value))}
                  min={1}
                  max={300}
                  className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label={`運動時間 ${index + 1}`}
                />
                <span className="text-xs text-gray-500">分</span>
                <button
                  type="button"
                  onClick={() => removeExercise(exercise.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  aria-label={`運動 ${index + 1} を削除`}
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
              </div>
            ))}
          </div>

          {/* 運動追加ボタン */}
          <button
            type="button"
            onClick={addExercise}
            className="w-full py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors text-sm flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>追加</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            運動を追加
          </button>
        </div>

        {/* 食事セクション */}
        <div className="space-y-3 p-4 bg-orange-50 rounded-lg">
          <span className="font-medium text-gray-700">食事評価</span>
          <div className="flex flex-wrap gap-2">
            {MEAL_RATINGS.map((rating) => (
              <button
                key={rating.value}
                type="button"
                onClick={() => setMealRating(rating.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mealRating === rating.value
                    ? `${rating.color} ring-2 ring-offset-1 ring-current`
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {rating.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-gray-600">間食した？</span>
            <button
              type="button"
              onClick={() => setHadSnack(!hadSnack)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hadSnack ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hadSnack ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 生活セクション */}
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">飲酒した？</span>
            <button
              type="button"
              onClick={() => setHadAlcohol(!hadAlcohol)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hadAlcohol ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hadAlcohol ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* メモ */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            メモ（任意）
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="今日の振り返りなど..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {isEditing ? '更新する' : '記録する'}
          </button>
        </div>
      </form>
    </div>
  );
}
