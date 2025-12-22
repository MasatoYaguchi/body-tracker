// apps/frontend/src/components/dashboard/QuickRecordForm.tsx
// 記録追加フォームコンポーネント

import type { BodyRecord } from '@body-tracker/shared/dist/types';
import { useCallback, useMemo, useState } from 'react';
import { api } from './Dashboard';
import { RecordForm, type RecordFormData } from './RecordForm';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初期値の設定
  const initialValues = useMemo(
    () => ({
      weight: latestRecord?.weight,
      bodyFatPercentage: latestRecord?.bodyFatPercentage,
      date: new Date().toISOString().split('T')[0],
    }),
    [latestRecord?.weight, latestRecord?.bodyFatPercentage],
  );

  const handleSubmit = useCallback(
    async (data: RecordFormData) => {
      setIsSubmitting(true);
      try {
        await api.addRecord({
          weight: data.weight,
          bodyFatPercentage: data.bodyFatPercentage,
          date: data.date,
        });

        // データ再読み込み
        onRecordAdded();
      } catch (error) {
        alert(error instanceof Error ? error.message : '記録の追加に失敗しました');
      } finally {
        setIsSubmitting(false);
      }
    },
    [onRecordAdded],
  );

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

      <RecordForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="記録を追加"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
