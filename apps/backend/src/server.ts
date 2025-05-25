import { BodyRecord, Stats, validateBodyRecord } from '@body-tracker/shared'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { validator } from 'hono/validator'

// インメモリデータストア（実際のアプリではデータベースを使用）
let records: BodyRecord[] = []
let idCounter = 1

const app = new Hono()

// CORS設定
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type'],
}))

// バリデーションスキーマ
const bodyRecordValidator = validator('json', (value, c) => {
  const validation = validateBodyRecord(value)
  
  if (!validation.isValid) {
    return c.json({ error: validation.errors.join(', ') }, 400)
  }
  
  return value
})

// 全記録取得
app.get('/api/records', (c) => {
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return c.json(sortedRecords)
})

// 記録追加
app.post('/api/records', bodyRecordValidator, (c) => {
  const { weight, bodyFatPercentage, date } = c.req.valid('json')
  
  const newRecord: BodyRecord = {
    id: idCounter.toString(),
    weight,
    bodyFatPercentage,
    date,
    createdAt: new Date().toISOString()
  }
  
  records.push(newRecord)
  idCounter++
  
  return c.json(newRecord, 201)
})

// 記録更新
app.put('/api/records/:id', bodyRecordValidator, (c) => {
  const id = c.req.param('id')
  const { weight, bodyFatPercentage, date } = c.req.valid('json')
  
  const recordIndex = records.findIndex(r => r.id === id)
  
  if (recordIndex === -1) {
    return c.json({ error: '記録が見つかりません' }, 404)
  }
  
  records[recordIndex] = {
    ...records[recordIndex],
    weight,
    bodyFatPercentage,
    date
  }
  
  return c.json(records[recordIndex])
})

// 記録削除
app.delete('/api/records/:id', (c) => {
  const id = c.req.param('id')
  const recordIndex = records.findIndex(r => r.id === id)
  
  if (recordIndex === -1) {
    return c.json({ error: '記録が見つかりません' }, 404)
  }
  
  records.splice(recordIndex, 1)
  return c.json({ message: '記録を削除しました' })
})

// 統計情報取得
app.get('/api/stats', (c) => {
  if (records.length === 0) {
    return c.json({
      count: 0,
      latestWeight: null,
      latestBodyFat: null,
      weightChange: null,
      bodyFatChange: null
    } as Stats)
  }
  
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  const latest = sortedRecords[0]
  const previous = sortedRecords[1]
  
  return c.json({
    count: records.length,
    latestWeight: latest.weight,
    latestBodyFat: latest.bodyFatPercentage,
    weightChange: previous ? latest.weight - previous.weight : null,
    bodyFatChange: previous ? latest.bodyFatPercentage - previous.bodyFatPercentage : null
  } as Stats)
})

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ 
    message: 'Body Tracker API',
    version: '1.0.0',
    status: 'running'
  })
})

// サーバー起動
const port = 8000

console.log(`🚀 Server running at http://localhost:${port}`)
console.log('📊 API endpoints:')
console.log('  GET    /api/records - 全記録取得')
console.log('  POST   /api/records - 記録追加')
console.log('  PUT    /api/records/:id - 記録更新')
console.log('  DELETE /api/records/:id - 記録削除')
console.log('  GET    /api/stats - 統計情報取得')

serve({
  fetch: app.fetch,
  port: port,
})