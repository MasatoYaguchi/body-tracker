import { BODY_FAT_MAX, BODY_FAT_MIN, WEIGHT_MAX, WEIGHT_MIN } from '@body-tracker/shared';
import { memo, useEffect, useState } from 'react';
import { InlineSpinner } from '../ui/LoadingSpinner';

export interface RecordFormData {
  weight: number;
  bodyFatPercentage: number;
  date: string;
}

export interface RecordFormProps {
  initialValues?: Partial<RecordFormData>;
  onSubmit: (data: RecordFormData) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export const RecordForm = memo(function RecordForm({
  initialValues,
  onSubmit,
  submitLabel = '保存',
  isSubmitting = false,
}: RecordFormProps) {
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.weight) setWeight(initialValues.weight.toString());
      if (initialValues.bodyFatPercentage) setBodyFat(initialValues.bodyFatPercentage.toString());
      if (initialValues.date) setDate(initialValues.date.split('T')[0]);
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const weightNum = Number.parseFloat(weight);
    const bodyFatNum = Number.parseFloat(bodyFat);

    if (Number.isNaN(weightNum) || Number.isNaN(bodyFatNum)) {
      alert('有効な数値を入力してください');
      return;
    }

    if (weightNum < WEIGHT_MIN || weightNum > WEIGHT_MAX) {
      alert(`体重は${WEIGHT_MIN}から${WEIGHT_MAX}の間で入力してください`);
      return;
    }

    if (bodyFatNum < BODY_FAT_MIN || bodyFatNum > BODY_FAT_MAX) {
      alert(`体脂肪率は${BODY_FAT_MIN}から${BODY_FAT_MAX}の間で入力してください`);
      return;
    }

    await onSubmit({
      weight: weightNum,
      bodyFatPercentage: bodyFatNum,
      date,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 日付入力 */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          日付
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 体重入力 */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
            体重 (kg)
          </label>
          <input
            type="number"
            id="weight"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
            placeholder="60.0"
            required
          />
        </div>

        {/* 体脂肪率入力 */}
        <div>
          <label htmlFor="bodyFat" className="block text-sm font-medium text-gray-700 mb-2">
            体脂肪率 (%)
          </label>
          <input
            type="number"
            id="bodyFat"
            step="0.1"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
            placeholder="20.0"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
      >
        {isSubmitting ? <InlineSpinner /> : submitLabel}
      </button>
    </form>
  );
});
