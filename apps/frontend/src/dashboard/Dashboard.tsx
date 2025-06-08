// apps/frontend/src/components/dashboard/Dashboard.tsx
// メインダッシュボードコンポーネント（完全分割版）

import type { BodyRecord, Stats } from '@body-tracker/shared';
import { useCallback, useEffect, useState } from 'react';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { LoadingSpinner } from '../ui/LoadingSpinner';

import { DashboardHeader } from './DashboardHeader';
import { QuickRecordForm } from './QuickRecordForm';
import { RecentRecords } from './RecentRecords';
import { StatsCard } from './StatsCard';

// ===== API関数（認証対応版） =====

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

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
  // TODO:editingRecordが使われていないので、必要に応じて実装を追加
  const [_editingRecord, setEditingRecord] = useState<BodyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        {/* クイック記録フォーム */}
        <QuickRecordForm onRecordAdded={loadData} />
      </div>

      {/* 最近の記録一覧 */}
      <RecentRecords records={records} onEdit={setEditingRecord} onRefresh={loadData} />
    </div>
  );
}
