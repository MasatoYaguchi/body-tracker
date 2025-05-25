import { BodyRecord, Stats } from '@body-tracker/shared'
import React, { useEffect, useState } from 'react'

// API関数
const API_BASE = 'http://localhost:8000/api'

const api = {
  async getRecords(): Promise<BodyRecord[]> {
    const res = await fetch(`${API_BASE}/records`)
    if (!res.ok) throw new Error('記録の取得に失敗しました')
    return res.json()
  },

  async addRecord(record: Omit<BodyRecord, 'id' | 'createdAt'>): Promise<BodyRecord> {
    const res = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || '記録の追加に失敗しました')
    }
    return res.json()
  },

  async updateRecord(id: string, record: Omit<BodyRecord, 'id' | 'createdAt'>): Promise<BodyRecord> {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || '記録の更新に失敗しました')
    }
    return res.json()
  },

  async deleteRecord(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error('記録の削除に失敗しました')
  },

  async getStats(): Promise<Stats> {
    const res = await fetch(`${API_BASE}/stats`)
    if (!res.ok) throw new Error('統計情報の取得に失敗しました')
    return res.json()
  }
}

// コンポーネント
const RecordForm: React.FC<{
  onSubmit: (record: Omit<BodyRecord, 'id' | 'createdAt'>) => void
  editingRecord?: BodyRecord | null
  onCancel?: () => void
}> = ({ onSubmit, editingRecord, onCancel }) => {
  const [weight, setWeight] = useState(editingRecord?.weight?.toString() || '')
  const [bodyFat, setBodyFat] = useState(editingRecord?.bodyFatPercentage?.toString() || '')
  const [date, setDate] = useState(editingRecord?.date || new Date().toISOString().split('T')[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const weightNum = parseFloat(weight)
    const bodyFatNum = parseFloat(bodyFat)
    
    if (isNaN(weightNum) || isNaN(bodyFatNum)) {
      alert('有効な数値を入力してください')
      return
    }
    
    onSubmit({
      weight: weightNum,
      bodyFatPercentage: bodyFatNum,
      date
    })
    
    if (!editingRecord) {
      setWeight('')
      setBodyFat('')
      setDate(new Date().toISOString().split('T')[0])
    }
  }

  return (
    <div className="card p-6 animate-fade-in">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        {editingRecord ? '記録を編集' : '新しい記録を追加'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            日付
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
            required
          />
        </div>
        
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
            体重 (kg)
          </label>
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            step="0.1"
            min="0"
            max="1000"
            className="form-input"
            placeholder="例: 65.5"
            required
          />
        </div>
        
        <div>
          <label htmlFor="bodyFat" className="block text-sm font-medium text-gray-700 mb-2">
            体脂肪率 (%)
          </label>
          <input
            type="number"
            id="bodyFat"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            step="0.1"
            min="0"
            max="100"
            className="form-input"
            placeholder="例: 15.5"
            required
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <button type="submit" className="btn-primary flex-1">
            {editingRecord ? '更新' : '追加'}
          </button>
          {editingRecord && onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium 
                        hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 
                        focus:ring-offset-2 transition-all duration-200"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

const StatsDisplay: React.FC<{ stats: Stats }> = ({ stats }) => {
  if (stats.count === 0) {
    return (
      <div className="card p-6 animate-fade-in">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">統計情報</h3>
        <p className="text-gray-500 text-center py-8">まだ記録がありません</p>
      </div>
    )
  }

  return (
    <div className="card p-6 animate-fade-in">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">統計情報</h3>
      <div className="grid gap-4">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-primary-500">
          <span className="text-gray-700 font-medium">記録数</span>
          <span className="text-lg font-bold text-gray-900">{stats.count}回</span>
        </div>
        
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
          <span className="text-gray-700 font-medium">最新体重</span>
          <span className="text-lg font-bold text-gray-900">{stats.latestWeight}kg</span>
        </div>
        
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-500">
          <span className="text-gray-700 font-medium">最新体脂肪率</span>
          <span className="text-lg font-bold text-gray-900">{stats.latestBodyFat}%</span>
        </div>
        
        {stats.weightChange !== null && (
          <div className={`flex justify-between items-center p-4 rounded-lg border-l-4 ${
            stats.weightChange > 0 
              ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-500' 
              : stats.weightChange < 0 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500'
                : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-500'
          }`}>
            <span className="text-gray-700 font-medium">体重変化</span>
            <span className={`text-lg font-bold ${
              stats.weightChange > 0 
                ? 'text-red-600' 
                : stats.weightChange < 0 
                  ? 'text-green-600' 
                  : 'text-gray-900'
            }`}>
              {stats.weightChange > 0 ? '+' : ''}{stats.weightChange}kg
            </span>
          </div>
        )}
        
        {stats.bodyFatChange !== null && (
          <div className={`flex justify-between items-center p-4 rounded-lg border-l-4 ${
            stats.bodyFatChange > 0 
              ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-500' 
              : stats.bodyFatChange < 0 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500'
                : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-500'
          }`}>
            <span className="text-gray-700 font-medium">体脂肪率変化</span>
            <span className={`text-lg font-bold ${
              stats.bodyFatChange > 0 
                ? 'text-red-600' 
                : stats.bodyFatChange < 0 
                  ? 'text-green-600' 
                  : 'text-gray-900'
            }`}>
              {stats.bodyFatChange > 0 ? '+' : ''}{stats.bodyFatChange}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const RecordList: React.FC<{
  records: BodyRecord[]
  onEdit: (record: BodyRecord) => void
  onDelete: (id: string) => void
}> = ({ records, onEdit, onDelete }) => {
  if (records.length === 0) {
    return (
      <div className="card p-6 animate-fade-in">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">記録一覧</h3>
        <p className="text-gray-500 text-center py-8">まだ記録がありません</p>
      </div>
    )
  }

  return (
    <div className="card p-6 animate-fade-in">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">記録一覧</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {records.map((record, index) => (
          <div 
            key={record.id} 
            className="p-4 border-2 border-gray-100 rounded-lg hover:border-primary-200 
                      hover:shadow-md transition-all duration-200 animate-slide-up group"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-2">
                  {new Date(record.date).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                <div className="flex gap-4 mb-3">
                  <div className="bg-blue-50 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-blue-700">
                      体重: {record.weight}kg
                    </span>
                  </div>
                  <div className="bg-purple-50 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-purple-700">
                      体脂肪率: {record.bodyFatPercentage}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button 
                  onClick={() => onEdit(record)}
                  className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md 
                            hover:bg-primary-200 focus:outline-none focus:ring-2 
                            focus:ring-primary-300 transition-colors duration-200"
                >
                  編集
                </button>
                <button 
                  onClick={() => {
                    if (confirm('この記録を削除しますか？')) {
                      onDelete(record.id)
                    }
                  }}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md 
                            hover:bg-red-200 focus:outline-none focus:ring-2 
                            focus:ring-red-300 transition-colors duration-200"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// メインアプリコンポーネント
const App: React.FC = () => {
  const [records, setRecords] = useState<BodyRecord[]>([])
  const [stats, setStats] = useState<Stats>({ 
    count: 0, 
    latestWeight: null, 
    latestBodyFat: null, 
    weightChange: null, 
    bodyFatChange: null 
  })
  const [editingRecord, setEditingRecord] = useState<BodyRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // データ読み込み
  const loadData = async () => {
    try {
      setLoading(true)
      const [recordsData, statsData] = await Promise.all([
        api.getRecords(),
        api.getStats()
      ])
      setRecords(recordsData)
      setStats(statsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 記録追加
  const handleAddRecord = async (recordData: Omit<BodyRecord, 'id' | 'createdAt'>) => {
    try {
      await api.addRecord(recordData)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '記録の追加に失敗しました')
    }
  }

  // 記録更新
  const handleUpdateRecord = async (recordData: Omit<BodyRecord, 'id' | 'createdAt'>) => {
    if (!editingRecord) return
    
    try {
      await api.updateRecord(editingRecord.id, recordData)
      setEditingRecord(null)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '記録の更新に失敗しました')
    }
  }

  // 記録削除
  const handleDeleteRecord = async (id: string) => {
    try {
      await api.deleteRecord(id)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '記録の削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 text-lg font-medium mb-4">エラーが発生しました</p>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadData}
            className="btn-primary"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 text-center">
            <h1 className="text-4xl font-light tracking-wide">
              体重・体脂肪率管理
            </h1>
            <p className="mt-2 text-primary-100 text-lg">
              健康な毎日をサポート
            </p>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <RecordForm
              onSubmit={editingRecord ? handleUpdateRecord : handleAddRecord}
              editingRecord={editingRecord}
              onCancel={() => setEditingRecord(null)}
            />
            <StatsDisplay stats={stats} />
          </div>
          
          <div>
            <RecordList
              records={records}
              onEdit={setEditingRecord}
              onDelete={handleDeleteRecord}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App