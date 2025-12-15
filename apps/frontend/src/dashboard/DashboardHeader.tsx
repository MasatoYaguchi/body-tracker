// apps/frontend/src/components/dashboard/DashboardHeader.tsx
// ダッシュボードヘッダーコンポーネント

import type { Stats } from '@body-tracker/shared';

/**
 * DashboardHeaderコンポーネントのProps
 */
export interface DashboardHeaderProps {
  /** 統計情報 */
  stats: Stats;
}

/**
 * ダッシュボードヘッダーコンポーネント
 *
 * @param props - DashboardHeaderProps
 * @returns React.ReactElement
 */
export function DashboardHeader({ stats }: DashboardHeaderProps): React.ReactElement {
  return (
    <div className="text-center py-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
      {stats.count > 0 && (
        <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
          <span className="text-sm text-gray-600">総記録数:</span>
          <span className="ml-2 text-lg font-semibold text-primary-600">{stats.count}回</span>
        </div>
      )}
    </div>
  );
}
