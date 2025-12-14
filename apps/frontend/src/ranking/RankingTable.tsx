import type React from 'react';
import type { RankingParticipant } from './types';

interface RankingTableProps {
  participants: RankingParticipant[];
}

export function RankingTable({ participants }: RankingTableProps): React.ReactElement {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="text-2xl" role="img" aria-label="1st place">
            🏆
          </span>
        );
      case 2:
        return (
          <span className="text-2xl" role="img" aria-label="2nd place">
            🥈
          </span>
        );
      case 3:
        return (
          <span className="text-2xl" role="img" aria-label="3rd place">
            🥉
          </span>
        );
      default:
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getRowStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 2:
        return 'bg-gray-50 hover:bg-gray-100';
      case 3:
        return 'bg-orange-50 hover:bg-orange-100';
      default:
        return 'hover:bg-gray-50';
    }
  };

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th scope="col" className="px-6 py-3 text-center w-16">
              順位
            </th>
            <th scope="col" className="px-6 py-3">
              ユーザー
            </th>
            <th scope="col" className="px-6 py-3 text-right">
              体重
              <br />
              <span className="text-xs font-normal text-gray-500">(開始 → 現在)</span>
            </th>
            <th scope="col" className="px-6 py-3 text-right font-bold text-blue-600">
              減少率
            </th>
            <th scope="col" className="px-6 py-3 text-right">
              体脂肪率
              <br />
              <span className="text-xs font-normal text-gray-500">(開始 → 現在)</span>
            </th>
            <th scope="col" className="px-6 py-3 text-right font-bold text-green-600">
              減少率
            </th>
            <th scope="col" className="px-6 py-3 text-right font-black text-indigo-600 text-base">
              総合スコア
            </th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.userId} className={`border-b transition-colors ${getRowStyle(p.rank)}`}>
              <td className="px-6 py-4 text-center font-medium text-gray-900">
                {getRankIcon(p.rank)}
              </td>
              <td className="px-6 py-4 font-medium text-gray-900">{p.username}</td>
              <td className="px-6 py-4 text-right">
                <div className="text-gray-500 text-xs">{p.baselineWeight.toFixed(1)}kg</div>
                <div className="font-medium text-gray-900">→ {p.currentWeight.toFixed(1)}kg</div>
              </td>
              <td className="px-6 py-4 text-right font-bold text-blue-600">
                {p.weightLossRate > 0 ? '-' : '+'}
                {Math.abs(p.weightLossRate).toFixed(1)}%
              </td>
              <td className="px-6 py-4 text-right">
                <div className="text-gray-500 text-xs">{p.baselineBodyFat.toFixed(1)}%</div>
                <div className="font-medium text-gray-900">→ {p.currentBodyFat.toFixed(1)}%</div>
              </td>
              <td className="px-6 py-4 text-right font-bold text-green-600">
                {p.bodyFatLossRate > 0 ? '-' : '+'}
                {Math.abs(p.bodyFatLossRate).toFixed(1)}%
              </td>
              <td className="px-6 py-4 text-right font-black text-indigo-600 text-lg">
                {p.totalScore.toFixed(1)}pt
              </td>
            </tr>
          ))}
          {participants.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                データがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
