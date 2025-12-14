import type React from 'react';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { RankingTable } from './RankingTable';
import type { RankingData } from './types';

// ダミーデータ (API実装までのプレースホルダー)
const DUMMY_DATA: RankingData = {
  competitionName: '2025年ボディメイクチャレンジ',
  startDate: '2025-06-01',
  endDate: '2025-12-31',
  rankings: [
    {
      rank: 1,
      userId: 'user_a',
      username: 'Aさん',
      baselineWeight: 75.5,
      currentWeight: 71.2,
      weightLossRate: 5.7,
      baselineBodyFat: 22.0,
      currentBodyFat: 19.5,
      bodyFatLossRate: 11.4,
      totalScore: 17.1,
      recordedAt: '2025-12-14T10:00:00Z',
    },
    {
      rank: 2,
      userId: 'user_b',
      username: 'Bさん',
      baselineWeight: 68.0,
      currentWeight: 65.1,
      weightLossRate: 4.3,
      baselineBodyFat: 25.0,
      currentBodyFat: 22.0,
      bodyFatLossRate: 12.0,
      totalScore: 16.3,
      recordedAt: '2025-12-14T09:30:00Z',
    },
    {
      rank: 3,
      userId: 'user_c',
      username: 'Cさん',
      baselineWeight: 82.3,
      currentWeight: 78.1,
      weightLossRate: 5.1,
      baselineBodyFat: 28.5,
      currentBodyFat: 26.2,
      bodyFatLossRate: 8.1,
      totalScore: 13.2,
      recordedAt: '2025-12-13T20:15:00Z',
    },
  ],
};

export function RankingPage(): React.ReactElement {
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // APIコールのシミュレーション
    const timer = setTimeout(() => {
      setData(DUMMY_DATA);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingSpinner size="large" message="ランキングを集計中..." />;
  }

  if (!data) {
    return <div className="text-center py-10 text-red-500">データの取得に失敗しました</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{data.competitionName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            期間: {data.startDate} 〜 {data.endDate || '継続中'}
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-500 text-xl">ℹ️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                ランキングは「体重減少率(%)」と「体脂肪率減少率(%)」の合計スコアで決定されます。
                <br />
                健康的に痩せることを目的としているため、筋肉量を維持しやすい体脂肪率の減少も評価されます。
              </p>
            </div>
          </div>
        </div>

        <RankingTable participants={data.rankings} />

        <div className="mt-6 text-right text-xs text-gray-400">
          最終更新: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
