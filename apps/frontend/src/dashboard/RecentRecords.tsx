// apps/frontend/src/components/dashboard/RecentRecords.tsx
// 最近の記録一覧表示コンポーネント

import type { BodyRecord } from '@body-tracker/shared';

/**
 * RecentRecordsコンポーネントのProps
 */
export interface RecentRecordsProps {
  /** 記録データ */
  records: BodyRecord[];
  /** 編集ボタンクリック時のコールバック */
  onEdit: (record: BodyRecord) => void;
  /** データ再読み込み用コールバック */
  onRefresh: () => void;
}

/**
 * 最近の記録一覧表示コンポーネント
 *
 * @param props - RecentRecordsProps
 * @returns React.ReactElement
 */
export function RecentRecords({
  records,
  onEdit,
  onRefresh,
}: RecentRecordsProps): React.ReactElement {
  const recentRecords = records.slice(0, 5); // 最新5件

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
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
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          最近の記録
        </h2>
        <div className="flex items-center space-x-2">
          {records.length > 5 && (
            <span className="text-sm text-gray-500">{records.length}件中5件を表示</span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            aria-label="記録を更新"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>体重・体脂肪率管理アプリアイコン</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {recentRecords.length === 0 ? (
        <EmptyRecordsState />
      ) : (
        <div className="space-y-3">
          {recentRecords.map((record, index) => (
            <RecordItem key={record.id} record={record} index={index} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 記録が空の場合の表示
 */
function EmptyRecordsState(): React.ReactElement {
  return (
    <div className="text-center py-8">
      <div className="text-gray-400 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>体重・体脂肪率管理アプリアイコン</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p className="text-gray-500 text-lg mb-2">まだ記録がありません</p>
      <p className="text-gray-400 text-sm">上のフォームから最初の記録を追加してみましょう</p>
    </div>
  );
}

/**
 * 個別記録項目コンポーネント
 */
function RecordItem({
  record,
  index,
  onEdit,
}: {
  record: BodyRecord;
  index: number;
  onEdit: (record: BodyRecord) => void;
}): React.ReactElement {
  return (
    <div
      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex-1">
        <div className="text-sm text-gray-500 mb-1">
          {new Date(record.date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </div>
        <div className="flex gap-4">
          <div className="bg-blue-100 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-blue-700">体重: {record.weight}kg</span>
          </div>
          <div className="bg-purple-100 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-purple-700">
              体脂肪率: {record.bodyFatPercentage}%
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onEdit(record)}
        className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        aria-label="記録を編集"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>体重・体脂肪率管理アプリアイコン</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
    </div>
  );
}
