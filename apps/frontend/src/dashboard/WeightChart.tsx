import type { BodyRecord } from '@body-tracker/shared';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useWindowSize } from '../hooks/useWindowSize';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WeightChartProps {
  records: BodyRecord[];
}

export function WeightChart({ records }: WeightChartProps) {
  // ウィンドウサイズ変更を検知して再レンダリングをトリガー
  // Chart.jsのresponsive: trueだけでは不十分な場合の保険
  useWindowSize();

  const chartData = useMemo(() => {
    // 日付の昇順（古い順）に並び替え
    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // 直近30件程度に絞る（多すぎると見づらいため）
    const displayRecords = sortedRecords.slice(-30);

    const labels = displayRecords.map((record) => {
      const date = new Date(record.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const weights = displayRecords.map((record) => record.weight);
    const bodyFats = displayRecords.map((record) => record.bodyFatPercentage);

    return {
      labels,
      datasets: [
        {
          label: '体重 (kg)',
          data: weights,
          borderColor: 'rgb(59, 130, 246)', // blue-500
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: '体脂肪率 (%)',
          data: bodyFats,
          borderColor: 'rgb(239, 68, 68)', // red-500
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          yAxisID: 'y1',
          tension: 0.3,
        },
      ],
    };
  }, [records]);

  const options = {
    responsive: true,
    maintainAspectRatio: false, // コンテナのサイズに合わせてリサイズ
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '体重 (kg)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: '体脂肪率 (%)',
        },
      },
    },
  };

  return (
    <div className="card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Chart Icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          推移グラフ
        </h2>
      </div>
      <div className="relative h-96 w-full">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}
