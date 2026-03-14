import type { ActivityRecord } from '@body-tracker/shared';
import { useMemo, useState } from 'react';

interface ActivityStatsChartProps {
  activities: ActivityRecord[];
}

type Period = 'week' | 'month';

interface DayStats {
  date: string;
  label: string;
  exerciseMinutes: number;
  hadExercise: boolean;
  hadSnack: boolean;
  hadAlcohol: boolean;
  mealRating: number | null;
}

function getDateRange(period: Period): { start: Date; end: Date; days: number } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  if (period === 'week') {
    start.setDate(start.getDate() - 6);
  } else {
    start.setDate(start.getDate() - 29);
  }
  start.setHours(0, 0, 0, 0);

  return {
    start,
    end,
    days: period === 'week' ? 7 : 30,
  };
}

function formatDateLabel(date: Date, period: Period): string {
  if (period === 'week') {
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${date.getMonth() + 1}/${date.getDate()}(${weekday})`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function ActivityStatsChart({ activities }: ActivityStatsChartProps): React.ReactElement {
  const [period, setPeriod] = useState<Period>('week');

  const stats = useMemo(() => {
    const { start, days } = getDateRange(period);
    const dailyStats: DayStats[] = [];

    // 日付ごとの初期データを作成
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      dailyStats.push({
        date: dateStr,
        label: formatDateLabel(date, period),
        exerciseMinutes: 0,
        hadExercise: false,
        hadSnack: false,
        hadAlcohol: false,
        mealRating: null,
      });
    }

    // 活動データを集計
    for (const activity of activities) {
      const dayIndex = dailyStats.findIndex((d) => d.date === activity.date);
      if (dayIndex !== -1) {
        const day = dailyStats[dayIndex];
        day.exerciseMinutes = activity.exercises.reduce((sum, e) => sum + e.minutes, 0);
        day.hadExercise = activity.exercises.length > 0;
        day.hadSnack = activity.hadSnack;
        day.hadAlcohol = activity.hadAlcohol;
        day.mealRating = activity.mealRating ?? null;
      }
    }

    return dailyStats;
  }, [activities, period]);

  // 集計値
  const summary = useMemo(() => {
    const totalDays = stats.length;
    const exerciseDays = stats.filter((d) => d.hadExercise).length;
    const snackDays = stats.filter((d) => d.hadSnack).length;
    const alcoholDays = stats.filter((d) => d.hadAlcohol).length;
    const totalExerciseMinutes = stats.reduce((sum, d) => sum + d.exerciseMinutes, 0);

    return {
      exerciseDays,
      exerciseRate: Math.round((exerciseDays / totalDays) * 100),
      snackDays,
      snackRate: Math.round((snackDays / totalDays) * 100),
      alcoholDays,
      alcoholRate: Math.round((alcoholDays / totalDays) * 100),
      totalExerciseMinutes,
    };
  }, [stats]);

  // 運動時間の最大値（グラフのスケール用）
  const maxExerciseMinutes = Math.max(...stats.map((d) => d.exerciseMinutes), 60);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          活動サマリー
        </h2>

        {/* 期間切り替え */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            週間
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            月間
          </button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.exerciseRate}%</div>
          <div className="text-xs text-gray-600">運動した日</div>
          <div className="text-xs text-gray-500">
            {summary.exerciseDays}日 / 計{summary.totalExerciseMinutes}分
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{summary.snackRate}%</div>
          <div className="text-xs text-gray-600">間食した日</div>
          <div className="text-xs text-gray-500">{summary.snackDays}日</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{summary.alcoholRate}%</div>
          <div className="text-xs text-gray-600">飲酒した日</div>
          <div className="text-xs text-gray-500">{summary.alcoholDays}日</div>
        </div>
      </div>

      {/* 運動時間グラフ */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">運動時間</h3>
        <div className={`flex items-end gap-1 h-24 ${period === 'month' ? 'overflow-x-auto' : ''}`}>
          {stats.map((day) => {
            const height =
              day.exerciseMinutes > 0
                ? Math.max((day.exerciseMinutes / maxExerciseMinutes) * 100, 5)
                : 0;

            return (
              <div
                key={day.date}
                className="flex-1 min-w-[8px] flex flex-col items-center"
                title={`${day.label}: ${day.exerciseMinutes}分`}
              >
                <div
                  className={`w-full rounded-t transition-all ${
                    day.exerciseMinutes > 0 ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
        {period === 'week' && (
          <div className="flex gap-1 mt-1">
            {stats.map((day) => (
              <div key={day.date} className="flex-1 text-center text-xs text-gray-500 truncate">
                {day.label.split('(')[0]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 凡例 */}
      <div className="flex items-center gap-4 pt-4 border-t text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-500 rounded" />
          <span>運動あり</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-400 rounded" />
          <span>間食</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-purple-500 rounded" />
          <span>飲酒</span>
        </div>
      </div>

      {/* 日ごとの詳細（週間のみ） */}
      {period === 'week' && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex gap-1">
            {stats.map((day) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
                title={day.label}
              >
                {day.hadExercise && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                {day.hadSnack && <span className="w-2 h-2 bg-orange-400 rounded-full" />}
                {day.hadAlcohol && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
                {!day.hadExercise && !day.hadSnack && !day.hadAlcohol && (
                  <span className="w-2 h-2 bg-gray-200 rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
