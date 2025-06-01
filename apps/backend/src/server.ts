// apps/backend/src/server.ts (認証機能統合版)
import { type Stats, validateBodyRecord } from '@body-tracker/shared';
import { serve } from '@hono/node-server';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { validator } from 'hono/validator';
import { db } from './db/connection';
import { bodyRecords } from './db/schema';
import { authMiddleware, getAuthenticatedUser } from './middleware/auth';
import authRoutes from './routes/auth';

// サーバーの初期化
const app = new Hono();

// CORS設定（認証対応）
app.use(
  '/*',
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// 🔐 認証ルート（認証不要）
app.route('/api/auth', authRoutes);

// バリデーションスキーマ
const bodyRecordValidator = validator('json', (value, c) => {
  const validation = validateBodyRecord(value);

  if (!validation.isValid) {
    return c.json({ error: validation.errors.join(', ') }, 400);
  }

  return value;
});

// 📊 認証が必要なAPIエンドポイント

/**
 * 全記録取得（認証必須）
 * GET /api/records
 */
app.get('/api/records', authMiddleware, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);

    console.log('📊 記録取得リクエスト - ユーザー:', userPayload.email);

    // ユーザーに関連する記録のみ取得
    const userRecords = await db
      .select()
      .from(bodyRecords)
      .where(eq(bodyRecords.userId, userPayload.userId))
      .orderBy(desc(bodyRecords.recordedDate));

    // DECIMALを数値に変換してフロントエンドに送信
    const formattedRecords = userRecords.map((record) => ({
      id: record.id,
      weight: Math.round(Number.parseFloat(record.weight) * 10) / 10,
      bodyFatPercentage: Math.round(Number.parseFloat(record.bodyFatPercentage) * 10) / 10,
      date: record.recordedDate,
      createdAt: record.createdAt?.toISOString() || '',
    }));

    console.log(`✅ ${formattedRecords.length}件の記録を取得`);
    return c.json(formattedRecords);
  } catch (error) {
    console.error('❌ Records API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 記録追加（認証必須）
 * POST /api/records
 */
app.post('/api/records', authMiddleware, bodyRecordValidator, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);
    const { weight, bodyFatPercentage, date } = c.req.valid('json');

    console.log('➕ 記録追加リクエスト - ユーザー:', userPayload.email);

    const [newRecord] = await db
      .insert(bodyRecords)
      .values({
        userId: userPayload.userId, // 認証されたユーザーのID
        weight: weight.toString(),
        bodyFatPercentage: bodyFatPercentage.toString(),
        recordedDate: date,
      })
      .returning();

    // 適切な形式でレスポンス
    const formattedRecord = {
      id: newRecord.id,
      weight: Math.round(Number.parseFloat(newRecord.weight) * 10) / 10,
      bodyFatPercentage: Math.round(Number.parseFloat(newRecord.bodyFatPercentage) * 10) / 10,
      date: newRecord.recordedDate,
      createdAt: newRecord.createdAt?.toISOString() || '',
    };

    console.log('✅ 記録追加完了:', formattedRecord.id);
    return c.json(formattedRecord, 201);
  } catch (error) {
    console.error('❌ Create record API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 記録更新（認証必須）
 * PUT /api/records/:id
 */
app.put('/api/records/:id', authMiddleware, bodyRecordValidator, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);
    const id = c.req.param('id');
    const { weight, bodyFatPercentage, date } = c.req.valid('json');

    console.log('✏️ 記録更新リクエスト - ユーザー:', userPayload.email, 'レコードID:', id);

    // ユーザーの記録のみ更新可能
    const [updatedRecord] = await db
      .update(bodyRecords)
      .set({
        weight: weight.toString(),
        bodyFatPercentage: bodyFatPercentage.toString(),
        recordedDate: date,
      })
      .where(eq(bodyRecords.id, id) && eq(bodyRecords.userId, userPayload.userId))
      .returning();

    if (!updatedRecord) {
      console.log('❌ 記録が見つからない:', id);
      return c.json({ error: '記録が見つかりません' }, 404);
    }

    const formattedRecord = {
      id: updatedRecord.id,
      weight: Math.round(Number.parseFloat(updatedRecord.weight) * 10) / 10,
      bodyFatPercentage: Math.round(Number.parseFloat(updatedRecord.bodyFatPercentage) * 10) / 10,
      date: updatedRecord.recordedDate,
      createdAt: updatedRecord.createdAt?.toISOString() || '',
    };

    console.log('✅ 記録更新完了:', formattedRecord.id);
    return c.json(formattedRecord);
  } catch (error) {
    console.error('❌ Update record API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 記録削除（認証必須）
 * DELETE /api/records/:id
 */
app.delete('/api/records/:id', authMiddleware, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);
    const id = c.req.param('id');

    console.log('🗑️ 記録削除リクエスト - ユーザー:', userPayload.email, 'レコードID:', id);

    // ユーザーの記録のみ削除可能
    const [deletedRecord] = await db
      .delete(bodyRecords)
      .where(eq(bodyRecords.id, id) && eq(bodyRecords.userId, userPayload.userId))
      .returning();

    if (!deletedRecord) {
      console.log('❌ 削除対象が見つからない:', id);
      return c.json({ error: '記録が見つかりません' }, 404);
    }

    console.log('✅ 記録削除完了:', deletedRecord.id);
    return c.json({ message: '記録を削除しました' });
  } catch (error) {
    console.error('❌ Delete record API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 統計情報取得（認証必須）
 * GET /api/stats
 */
app.get('/api/stats', authMiddleware, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);

    console.log('📈 統計情報取得リクエスト - ユーザー:', userPayload.email);

    // ユーザーの記録のみ集計
    const allRecords = await db
      .select()
      .from(bodyRecords)
      .where(eq(bodyRecords.userId, userPayload.userId))
      .orderBy(desc(bodyRecords.recordedDate));

    if (allRecords.length === 0) {
      console.log('📊 記録なし');
      return c.json({
        count: 0,
        latestWeight: null,
        latestBodyFat: null,
        weightChange: null,
        bodyFatChange: null,
      } as Stats);
    }

    const latest = allRecords[0];
    const previous = allRecords[1] || null;

    const stats = {
      count: allRecords.length,
      latestWeight: Number.parseFloat(latest.weight),
      latestBodyFat: Number.parseFloat(latest.bodyFatPercentage),
      weightChange: previous
        ? Number.parseFloat(latest.weight) - Number.parseFloat(previous.weight)
        : null,
      bodyFatChange: previous
        ? Number.parseFloat(latest.bodyFatPercentage) -
          Number.parseFloat(previous.bodyFatPercentage)
        : null,
    } as Stats;

    console.log('✅ 統計情報取得完了:', stats.count, '件');
    return c.json(stats);
  } catch (error) {
    console.error('❌ Stats API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * ヘルスチェック（認証不要）
 * GET /
 */
app.get('/', (c) => {
  return c.json({
    message: 'Body Tracker API with Google OAuth',
    version: '2.0.0',
    status: 'running',
    features: ['Google OAuth Authentication', 'JWT Authorization', 'User-specific data'],
  });
});

// サーバー起動
const port = 8000;

console.log(`🚀 Server running at http://localhost:${port}`);
console.log('🔐 Authentication endpoints:');
console.log('  POST   /api/auth/google - Google OAuth認証');
console.log('  GET    /api/auth/me - ユーザー情報取得');
console.log('  POST   /api/auth/logout - ログアウト');
console.log('  GET    /api/auth/status - 認証ステータス確認');
console.log('');
console.log('📊 Protected API endpoints (認証必須):');
console.log('  GET    /api/records - 全記録取得');
console.log('  POST   /api/records - 記録追加');
console.log('  PUT    /api/records/:id - 記録更新');
console.log('  DELETE /api/records/:id - 記録削除');
console.log('  GET    /api/stats - 統計情報取得');
console.log('');
console.log('🔑 Required environment variables:');
console.log('  - DATABASE_URL (Neon PostgreSQL)');
console.log('  - JWT_SECRET (JWT signing key)');
console.log('  - GOOGLE_CLIENT_ID (Google OAuth)');

serve({
  fetch: app.fetch,
  port: port,
});
