import { type Stats, validateBodyRecord } from '@body-tracker/shared';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { validator } from 'hono/validator';
import { createDb } from './db/connection';
import { bodyRecords } from './db/schema';
import { authMiddleware, getAuthenticatedUser } from './middleware/auth';
import authRoutes from './routes/auth';
import rankingRoutes from './routes/ranking';
import type { Bindings, Variables } from './types';

// サーバーの初期化
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * DB接続ミドルウェア
 *
 * - Cloudflare Workersでは環境変数は `c.env` から取得する
 * - リクエストごとにDB接続を初期化し、コンテキスト (`c.var`) に注入する (Dependency Injection)
 * - これにより、ルートハンドラ内で `c.var.db` としてDBにアクセスできる
 */
app.use('*', async (c, next) => {
  const db = createDb(c.env.DATABASE_URL);
  c.set('db', db);
  await next();
});

// CORS設定（認証対応）
app.use(
  '/*',
  cors({
    origin: (origin) => {
      if (!origin) return null;
      // Allow localhost and 127.0.0.1 for local development
      if (
        origin.startsWith('http://localhost:3000') ||
        origin.startsWith('http://127.0.0.1:3000') ||
        origin.startsWith('http://localhost:3001')
      ) {
        return origin;
      }
      // Allow production Cloudflare Pages
      if (origin === 'https://body-tracker.pages.dev') {
        return origin;
      }
      // Allow preview deployments: https://<hash>.body-tracker.pages.dev
      if (/^https:\/\/[a-z0-9-]+\.body-tracker\.pages\.dev$/.test(origin)) {
        return origin;
      }
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// 🔐 認証ルート（認証不要）
app.route('/api/auth', authRoutes);

// 🏆 ランキングルート
app.route('/api/ranking', rankingRoutes);

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
 *
 * - 認証済みユーザーID (`userPayload.userId`) を使用してデータをフィルタリング
 * - 他のユーザーのデータが見えないようにする (マルチテナントの基本)
 */
app.get('/api/records', authMiddleware, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);

    console.log('📊 記録取得リクエスト - ユーザー:', userPayload.email);

    // ユーザーに関連する記録のみ取得
    const userRecords = await c.var.db
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
 *
 * - 新しいレコードを作成する際、認証済みユーザーIDを紐付ける
 * - バリデーション済みのデータを使用する
 */
app.post('/api/records', authMiddleware, bodyRecordValidator, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);
    const { weight, bodyFatPercentage, date } = c.req.valid('json');

    console.log('➕ 記録追加リクエスト - ユーザー:', userPayload.email);

    const [newRecord] = await c.var.db
      .insert(bodyRecords)
      .values({
        userId: userPayload.userId, // 認証されたユーザーのID
        weight: weight.toString(),
        bodyFatPercentage: bodyFatPercentage.toString(),
        recordedDate: new Date(date),
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
 *
 * - 更新対象のレコードが、認証済みユーザーのものであるかを確認する (`and(eq(...), eq(...))`)
 * - IDだけで更新すると、他人のデータを書き換えてしまう脆弱性 (IDOR) になるため注意
 */
app.put('/api/records/:id', authMiddleware, bodyRecordValidator, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);
    const id = c.req.param('id');
    const { weight, bodyFatPercentage, date } = c.req.valid('json');

    console.log('✏️ 記録更新リクエスト - ユーザー:', userPayload.email, 'レコードID:', id);

    // ユーザーの記録のみ更新可能
    const [updatedRecord] = await c.var.db
      .update(bodyRecords)
      .set({
        weight: weight.toString(),
        bodyFatPercentage: bodyFatPercentage.toString(),
        recordedDate: new Date(date),
      })
      .where(and(eq(bodyRecords.id, id), eq(bodyRecords.userId, userPayload.userId)))
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
 *
 * - 削除対象のレコードが、認証済みユーザーのものであるかを確認する
 */
app.delete('/api/records/:id', authMiddleware, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);
    const id = c.req.param('id');

    console.log('🗑️ 記録削除リクエスト - ユーザー:', userPayload.email, 'レコードID:', id);

    // ユーザーの記録のみ削除可能
    const [deletedRecord] = await c.var.db
      .delete(bodyRecords)
      .where(and(eq(bodyRecords.id, id), eq(bodyRecords.userId, userPayload.userId)))
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
 *
 * - ユーザーごとのデータを集計して返す
 */
app.get('/api/stats', authMiddleware, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);

    console.log('📈 統計情報取得リクエスト - ユーザー:', userPayload.email);

    // ユーザーの記録のみ集計
    const allRecords = await c.var.db
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

export default app;
