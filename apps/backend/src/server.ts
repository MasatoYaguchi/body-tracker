import { Stats, validateBodyRecord } from '@body-tracker/shared'
import { serve } from '@hono/node-server'
import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { validator } from 'hono/validator'
import { db } from './db/connection'
import { bodyRecords, users } from './db/schema'

// サーバーの初期化
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
app.get('/api/records', async (c) => {
  try {
    const allRecords = await db
      .select()
      .from(bodyRecords)
      .orderBy(desc(bodyRecords.recordedDate))

    // DECIMALを数値に変換してフロントエンドに送信
    const formattedRecords = allRecords.map(record => ({
      id: record.id,
      weight: Math.round(parseFloat(record.weight) * 10) / 10,
      bodyFatPercentage: Math.round(parseFloat(record.bodyFatPercentage) * 10) / 10,
      date: record.recordedDate,
      createdAt: record.createdAt?.toISOString() || ''
    }))

    return c.json(formattedRecords)
  } catch (error) {
    console.error('Records API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 記録追加
app.post('/api/records', bodyRecordValidator, async (c) => {
  try {
    const { weight, bodyFatPercentage, date } = c.req.valid('json')
    
    // TODO: 実際のユーザーIDを使用（認証実装後）
    // 現在はdemo_userのIDを使用
    const demoUser = await db.select().from(users).where(eq(users.username, 'demo_user')).limit(1)
    const userId = demoUser[0]?.id
    
    if (!userId) {
      return c.json({ error: 'User not found' }, 404)
    }

    const [newRecord] = await db
      .insert(bodyRecords)
  .values({
    userId,
    weight: weight.toString(),
    bodyFatPercentage: bodyFatPercentage.toString(),
    recordedDate: date
  })
      .returning()

    // 適切な形式でレスポンス
    const formattedRecord = {
      id: newRecord.id,
      weight: Math.round(parseFloat(newRecord.weight) * 10) / 10,
      bodyFatPercentage: Math.round(parseFloat(newRecord.bodyFatPercentage) * 10) / 10,
      date: newRecord.recordedDate,
      createdAt: newRecord.createdAt?.toISOString() || ''
    }

    return c.json(formattedRecord, 201)
  } catch (error) {
    console.error('Create record API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 記録更新
app.put('/api/records/:id', bodyRecordValidator, async (c) => {
  try {
    const id = c.req.param('id')
    const { weight, bodyFatPercentage, date } = c.req.valid('json')
    
    const [updatedRecord] = await db
      .update(bodyRecords)
      .set({
        weight: weight.toString(),
        bodyFatPercentage: bodyFatPercentage.toString(),
        recordedDate: date
      })
      .where(eq(bodyRecords.id, id))
      .returning()
    
    if (!updatedRecord) {
      return c.json({ error: '記録が見つかりません' }, 404)
    }
    
    const formattedRecord = {
      id: updatedRecord.id,
      weight: Math.round(parseFloat(updatedRecord.weight) * 10) / 10,
      bodyFatPercentage: Math.round(parseFloat(updatedRecord.bodyFatPercentage) * 10) / 10,
      date: updatedRecord.recordedDate,
      createdAt: updatedRecord.createdAt?.toISOString() || ''
    }
    
    return c.json(formattedRecord)
  } catch (error) {
    console.error('Update record API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
   }
})

// 記録削除
app.delete('/api/records/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const [deletedRecord] = await db
      .delete(bodyRecords)
      .where(eq(bodyRecords.id, id))
      .returning()
    
    if (!deletedRecord) {
      return c.json({ error: '記録が見つかりません' }, 404)
    }
    
    return c.json({ message: '記録を削除しました' })
  } catch (error) {
    console.error('Delete record API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 統計情報取得
app.get('/api/stats', async (c) => {
  try {
    // 全記録数を取得
    const allRecords = await db
       .select()
      .from(bodyRecords)
      .orderBy(desc(bodyRecords.recordedDate))

    if (allRecords.length === 0) {
      return c.json({
        count: 0,
        latestWeight: null,
        latestBodyFat: null,
        weightChange: null,
        bodyFatChange: null
      } as Stats)
    }

    const latest = allRecords[0]
    const previous = allRecords[1] || null

    return c.json({
      count: allRecords.length,
      latestWeight: parseFloat(latest.weight),
      latestBodyFat: parseFloat(latest.bodyFatPercentage),
      weightChange: previous ? parseFloat(latest.weight) - parseFloat(previous.weight) : null,
      bodyFatChange: previous ? parseFloat(latest.bodyFatPercentage) - parseFloat(previous.bodyFatPercentage) : null
    } as Stats)

  } catch (error) {
    console.error('Stats API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
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