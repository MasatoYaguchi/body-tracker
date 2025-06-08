// apps/frontend/src/components/dashboard/StatsCard.tsx
// 統計情報表示カードコンポーネント

import type { Stats } from '@body-tracker/shared';

/**
 * StatsCardコンポーネントのProps
 */
export interface StatsCardProps {
  /** 統計情報 */
  stats: Stats;
}

/**
 * 統計情報表示カードコンポーネント
 *
 * @param props - StatsCardProps
 * @returns React.ReactElement
 */
export function StatsCard({ stats }: StatsCardProps): React.ReactElement {
  if (stats.count === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
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
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          統計情報
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>体重・体脂肪率管理アプリアイコン</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-2">まだ記録がありません</p>
          <p className="text-gray-400 text-sm">記録を追加すると統計情報が表示されます</p>
        </div>
      </div>
    );
  }

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
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        統計情報
      </h2>

      <div className="space-y-4">
        {/* 最新体重 */}
        {stats.latestWeight && (
          <StatItem
            label="最新体重"
            value={`${stats.latestWeight}kg`}
            bgColor="from-blue-50 to-indigo-50"
            borderColor="border-primary-500"
          />
        )}

        {/* 最新体脂肪率 */}
        {stats.latestBodyFat && (
          <StatItem
            label="最新体脂肪率"
            value={`${stats.latestBodyFat}%`}
            bgColor="from-purple-50 to-violet-50"
            borderColor="border-purple-500"
          />
        )}

        {/* 体重変化 */}
        {stats.weightChange !== null && (
          <ChangeStatItem label="体重変化" value={stats.weightChange} unit="kg" type="weight" />
        )}

        {/* 体脂肪率変化 */}
        {stats.bodyFatChange !== null && (
          <ChangeStatItem
            label="体脂肪率変化"
            value={stats.bodyFatChange}
            unit="%"
            type="bodyFat"
          />
        )}
      </div>
    </div>
  );
}

/**
 * 統計項目コンポーネント
 */
function StatItem({
  label,
  value,
  bgColor,
  borderColor,
}: {
  label: string;
  value: string;
  bgColor: string;
  borderColor: string;
}): React.ReactElement {
  return (
    <div
      className={`flex justify-between items-center p-4 bg-gradient-to-r ${bgColor} rounded-lg border-l-4 ${borderColor}`}
    >
      <span className="text-gray-700 font-medium">{label}</span>
      <span className="text-xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

/**
 * 変化統計項目コンポーネント
 */
function ChangeStatItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
  type: 'weight' | 'bodyFat';
}): React.ReactElement {
  const isIncrease = value > 0;
  const isDecrease = value < 0;

  const colorClass = isIncrease
    ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-500 text-red-600'
    : isDecrease
      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-600'
      : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-500 text-gray-900';

  const icon = isIncrease ? (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <title>体重・体脂肪率管理アプリアイコン</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 17l9.2-9.2M17 17V7H7"
      />
    </svg>
  ) : isDecrease ? (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <title>体重・体脂肪率管理アプリアイコン</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 7l-9.2 9.2M7 7v10h10"
      />
    </svg>
  ) : null;

  return (
    <div className={`flex justify-between items-center p-4 rounded-lg border-l-4 ${colorClass}`}>
      <span className="text-gray-700 font-medium">{label}</span>
      <span className={`text-xl font-bold flex items-center ${colorClass.split(' ').slice(-1)[0]}`}>
        {icon}
        {isIncrease ? '+' : ''}
        {value}
        {unit}
      </span>
    </div>
  );
}
