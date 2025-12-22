// apps/frontend/src/components/dashboard/Dashboard.tsx
// メインダッシュボードコンポーネント（完全分割版）

import type { BodyRecord, Stats } from '@body-tracker/shared';
import { useCallback, useEffect, useState } from 'react';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';

import { DashboardHeader } from './DashboardHeader';
import { QuickRecordForm } from './QuickRecordForm';
import { RecentRecords } from './RecentRecords';
import { RecordForm, type RecordFormData } from './RecordForm';
import { StatsCard } from './StatsCard';
import { WeightChart } from './WeightChart';

// ===== API関数（認証対応版） =====

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787/api';

/**
 * 認証ヘッダー付きのfetch関数
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('authToken');

  if (!token) {
    throw new Error('認証が必要です');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export const api = {
  async getRecords(): Promise<BodyRecord[]> {
    const res = await authenticatedFetch(`${API_BASE}/records`);
    if (!res.ok) throw new Error('記録の取得に失敗しました');
    return res.json();
  },

  async addRecord(record: Omit<BodyRecord, 'id' | 'createdAt'>): Promise<BodyRecord> {
    const res = await authenticatedFetch(`${API_BASE}/records`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || '記録の追加に失敗しました');
    }
    return res.json();
  },

  async updateRecord(
    id: string,
    record: Omit<BodyRecord, 'id' | 'createdAt'>,
  ): Promise<BodyRecord> {
    const res = await authenticatedFetch(`${API_BASE}/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || '記録の更新に失敗しました');
    }
    return res.json();
  },

  async deleteRecord(id: string): Promise<void> {
    const res = await authenticatedFetch(`${API_BASE}/records/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || '記録の削除に失敗しました');
    }
  },

  async getStats(): Promise<Stats> {
    const res = await authenticatedFetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('統計情報の取得に失敗しました');
    return res.json();
  },
};

// ===== Dashboard Props =====

/**
 * DashboardコンポーネントのProps
 */
export interface DashboardProps {
  /** エラー発生時のコールバック */
  onError?: (error: string) => void;
}

/**
 * メインダッシュボードコンポーネント
 *
 * 認証済みユーザー向けのメイン画面
 * - 統計情報の表示
 * - 記録の一覧表示
 * - 簡易的な記録フォーム
 *
 * @param props - DashboardProps
 * @returns React.ReactElement
 */
export function Dashboard({ onError }: DashboardProps): React.ReactElement {
  // ===== 状態管理 =====

  const [records, setRecords] = useState<BodyRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    count: 0,
    latestWeight: null,
    latestBodyFat: null,
    weightChange: null,
    bodyFatChange: null,
  });
  const [editingRecord, setEditingRecord] = useState<BodyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const latestRecord = records[0] ?? null;

  // ===== データ取得処理 =====

  /**
   * データの読み込み
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [recordsData, statsData] = await Promise.all([api.getRecords(), api.getStats()]);

      setRecords(recordsData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // 初回データ読み込み
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===== 更新処理 =====

  const handleUpdateRecord = async (data: RecordFormData) => {
    if (!editingRecord) return;

    // 変更がない場合は更新せずに閉じる
    if (
      data.weight === editingRecord.weight &&
      data.bodyFatPercentage === editingRecord.bodyFatPercentage &&
      data.date === editingRecord.date
    ) {
      setEditingRecord(null);
      return;
    }

    setIsUpdating(true);
    try {
      await api.updateRecord(editingRecord.id, {
        weight: data.weight,
        bodyFatPercentage: data.bodyFatPercentage,
        date: data.date,
      });

      await loadData();
      setEditingRecord(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '記録の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // ===== 削除処理 =====

  const handleDeleteRecord = async () => {
    if (!editingRecord) return;
    if (!confirm('本当にこの記録を削除しますか？')) return;

    setIsDeleting(true);
    try {
      await api.deleteRecord(editingRecord.id);
      await loadData();
      setEditingRecord(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '記録の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  // ===== レンダリング制御 =====
  if (loading) {
    return <LoadingSpinner size="large" message="データ読み込み中..." fullScreen />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="データの読み込みに失敗しました"
        message={error}
        onRetry={loadData}
        showRetry
      />
    );
  }

  // ===== JSX レンダリング =====

  return (
    <div className="space-y-8">
      {/* ダッシュボードヘッダー */}
      <DashboardHeader stats={stats} />

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 統計情報カード */}
        <StatsCard stats={stats} />

        {/* 記録フォーム */}
        <QuickRecordForm
          key={latestRecord?.id ?? 'empty'}
          onRecordAdded={loadData}
          latestRecord={latestRecord}
        />
      </div>

      {/* 推移グラフ */}
      <WeightChart records={records} />

      {/* 最近の記録一覧 */}
      <RecentRecords
        key={latestRecord?.id ?? 'empty'}
        records={records}
        onEdit={setEditingRecord}
        onRefresh={loadData}
      />

      {/* 編集モーダル */}
      <Modal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title="記録を編集"
        footer={
          <>
            <button
              type="button"
              onClick={handleDeleteRecord}
              disabled={isDeleting || isUpdating}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-1 sm:text-sm disabled:opacity-50"
              aria-label="記録を削除"
            >
              {isDeleting ? '削除中...' : '削除'}
            </button>
            <button
              type="button"
              onClick={() => setEditingRecord(null)}
              disabled={isDeleting || isUpdating}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-2 sm:text-sm"
            >
              キャンセル
            </button>
          </>
        }
      >
        {editingRecord && (
          <RecordForm
            initialValues={{
              weight: Number(editingRecord.weight),
              bodyFatPercentage: Number(editingRecord.bodyFatPercentage),
              date: editingRecord.date,
            }}
            onSubmit={handleUpdateRecord}
            submitLabel="更新する"
            isSubmitting={isUpdating}
          />
        )}
      </Modal>
    </div>
  );
}
