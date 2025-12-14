// apps/frontend/src/components/dashboard/QuickRecordForm.tsx
// 記録追加フォームコンポーネント

import type { BodyRecord } from '@body-tracker/shared/dist/types';
import { useState } from 'react';
import { api } from './Dashboard';

/**
 * QuickRecordFormコンポーネントのProps
 */
export interface QuickRecordFormProps {
  /** 記録追加後のコールバック */
  onRecordAdded: () => void;
  /** 最新の記録（オプション） */
  latestRecord?: BodyRecord | null;
}

/**
 * クイック記録追加フォームコンポーネント
 *
 * @param props - QuickRecordFormProps
 * @returns React.ReactElement
 */
export function QuickRecordForm({
  onRecordAdded,
  latestRecord,
}: QuickRecordFormProps): React.ReactElement {
  const [weight, setWeight] = useState(latestRecord?.weight.toString() || '');
  const [bodyFat, setBodyFat] = useState(latestRecord?.bodyFatPercentage.toString() || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log('🌸QuickRecordForm: latestRecord', latestRecord);
  /**
   * フォーム送信処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const weightNum = Number.parseFloat(weight);
    const bodyFatNum = Number.parseFloat(bodyFat);

    if (Number.isNaN(weightNum) || Number.isNaN(bodyFatNum)) {
      alert('有効な数値を入力してください');
      return;
    }

    if (weightNum <= 0 || weightNum > 1000) {
      alert('体重は0から1000の間で入力してください');
      return;
    }

    if (bodyFatNum < 0 || bodyFatNum > 100) {
      alert('体脂肪率は0から100の間で入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.addRecord({
        weight: weightNum,
        bodyFatPercentage: bodyFatNum,
        date,
      });

      // フォームをリセット

      setDate(new Date().toISOString().split('T')[0]);

      // データ再読み込み
      onRecordAdded();
    } catch (error) {
      alert(error instanceof Error ? error.message : '記録の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>体重・体脂肪率管理アプリアイコン</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        新しい記録を追加
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 日付入力 */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            日付
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
            required
          />
        </div>
        {/* 体重入力 */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
            体重 (kg)
          </label>
          <input
            id="weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            step="0.1"
            min="10"
            max="150"
            className="form-input"
            placeholder="例: 65.5"
            required
          />
        </div>
        {/* 体脂肪率入力 */}
        <div>
          <label htmlFor="bodyFat" className="block text-sm font-medium text-gray-700 mb-2">
            体脂肪率 (%)
          </label>
          <input
            id="bodyFat"
            type="number"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            step="0.1"
            min="1"
            max="50"
            className="form-input"
            placeholder="例: 15.5"
            required
          />
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          )}
          {isSubmitting ? '追加中...' : '記録を追加'}
        </button>
      </form>
    </div>
  );
}
