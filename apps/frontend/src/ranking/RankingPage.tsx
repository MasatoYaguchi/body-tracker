import type React from 'react';
import { useEffect, useState } from 'react';
import { authApi } from '../auth/services/authApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { RankingTable } from './RankingTable';
import type { RankingData } from './types';

export function RankingPage(): React.ReactElement {
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await authApi.fetchWithAuth('ranking');
        if (!response.ok) {
          throw new Error('ランキングデータの取得に失敗しました');
        }
        const rankingData = await response.json();
        setData(rankingData);
      } catch (err) {
        console.error('Ranking fetch error:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  if (loading) {
    return <LoadingSpinner size="large" message="ランキングを集計中..." />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-10 text-red-500">{error || 'データの取得に失敗しました'}</div>
    );
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

        {data.rankings.length < 2 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
            <p className="text-lg font-medium">対象のユーザーがいません</p>
            <p className="text-sm mt-2">ランキングを表示するには2名以上の参加者が必要です。</p>
          </div>
        ) : (
          <RankingTable participants={data.rankings} />
        )}

        <div className="mt-6 text-right text-xs text-gray-400">
          最終更新: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
