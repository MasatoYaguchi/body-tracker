import type { ActivityRecord, ExerciseEntry, ExerciseType } from '@body-tracker/shared';
import { useEffect, useState } from 'react';
import { RatingButtons } from '../ui/RatingButtons';

interface ActivityFormProps {
  exerciseTypes: ExerciseType[];
  onSubmit: (data: Omit<ActivityRecord, 'id' | 'createdAt'>) => void;
  initialValues?: ActivityRecord;
  isEditing?: boolean;
  onCancel?: () => void;
  onManageExerciseTypes?: () => void;
}

const MEAL_LABELS = ['抑えた', 'やや抑えた', '普通', 'やや食べすぎ', '食べすぎ'];
const ALCOHOL_LABELS = ['飲まなかった', '少し飲んだ', '適量', 'やや飲みすぎ', '飲みすぎ'];

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
  const [alcoholRating, setAlcoholRating] = useState(initialValues?.alcoholRating ?? 1);
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
      setAlcoholRating(initialValues.alcoholRating ?? 1);
      setNotes(initialValues.notes ?? '');
    } else {
      setDate(today);
      setExercises([]);
      setMealRating(3);
      setHadSnack(false);
      setAlcoholRating(1);
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
      alcoholRating,
      notes: notes || undefined,
    });

    // 新規追加時のみリセット
    if (!isEditing) {
      setDate(today);
      setExercises([]);
      setMealRating(3);
      setHadSnack(false);
      setAlcoholRating(1);
      setNotes('');
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
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
          <label htmlFor="date" className="block text-sm font-medium text-content-secondary mb-1">
            日付
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-content focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* 運動セクション */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-bold text-content">運動</span>
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
              <div key={exercise.id} className="flex items-center gap-2 bg-surface p-2 rounded-lg">
                <span className="text-xs text-content-muted w-4">{index + 1}</span>
                <select
                  value={exercise.exerciseTypeId}
                  onChange={(e) => updateExercise(exercise.id, 'exerciseTypeId', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-surface text-content focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-20 px-3 py-1.5 text-sm border border-border rounded-lg bg-surface text-content focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label={`運動時間 ${index + 1}`}
                />
                <span className="text-xs text-content-secondary">分</span>
                <button
                  type="button"
                  onClick={() => removeExercise(exercise.id)}
                  className="p-1 text-content-muted hover:text-danger"
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
            className="w-full py-2 border-2 border-dashed border-primary-300 rounded-lg text-primary-600 hover:bg-primary-100 transition-colors text-sm flex items-center justify-center gap-1"
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
        <div className="space-y-3 p-4 bg-surface-secondary rounded-lg">
          <span className="font-bold text-content">食事</span>
          <RatingButtons labels={MEAL_LABELS} value={mealRating} onChange={setMealRating} />

          <div className="flex items-center justify-between pt-2">
            <span className="text-content-secondary">間食した？</span>
            <button
              type="button"
              onClick={() => setHadSnack(!hadSnack)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hadSnack ? 'bg-warning' : 'bg-border-secondary'
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

        {/* 飲酒セクション */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-lg">
          <span className="font-bold text-content">飲酒</span>
          <RatingButtons
            labels={ALCOHOL_LABELS}
            value={alcoholRating}
            onChange={setAlcoholRating}
          />
        </div>

        {/* メモ */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-content-secondary mb-1">
            メモ（任意）
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="今日の振り返りなど..."
            className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-content focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-border text-content-secondary rounded-lg hover:bg-surface-secondary transition-colors"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-success text-white rounded-lg hover:opacity-90 transition-colors font-medium"
          >
            {isEditing ? '更新する' : '記録する'}
          </button>
        </div>
      </form>
    </div>
  );
}
