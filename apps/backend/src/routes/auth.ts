// apps/backend/src/routes/auth.ts
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import {
  exchangeCodeForIdToken,
  findOrCreateUser,
  generateJWT,
  verifyGoogleToken,
} from '../auth/google';
import * as schema from '../db/schema';
import { authMiddleware, getAuthenticatedUser } from '../middleware/auth';
import type { Bindings, Variables } from '../types';

// 認証ルーター作成
const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Google認証リクエストのバリデーター
 *
 * - リクエストボディの型安全性を確保
 * - 必須フィールドの存在チェック
 * - 早期エラーレスポンス
 */
const googleAuthValidator = validator('json', (value, c) => {
  if (!value.credential || typeof value.credential !== 'string') {
    return c.json({ error: 'Google credential is required' }, 400);
  }

  if (value.credential.length === 0) {
    return c.json({ error: 'Google credential cannot be empty' }, 400);
  }

  return value;
});

/**
 * Google OAuth認証エンドポイント
 * POST /api/auth/google
 *
 * - Google IDトークンの検証 (c.envからクライアントIDを取得)
 * - ユーザー作成/取得のビジネスロジック (c.var.dbを注入)
 * - JWT生成とレスポンス (c.envからシークレットを取得)
 */
auth.post('/google', googleAuthValidator, async (c) => {
  try {
    console.log('🚀 Google認証リクエスト受信');

    const { credential } = c.req.valid('json');

    // Step 1: Google認証トークンを検証
    const googlePayload = await verifyGoogleToken(credential, c.env.GOOGLE_CLIENT_ID);

    // Step 2: メール認証済みチェック
    if (!googlePayload.email_verified) {
      console.log('❌ メール未認証:', googlePayload.email);
      return c.json({ error: 'Email not verified by Google' }, 400);
    }

    // Step 3: ユーザー作成または取得
    const user = await findOrCreateUser(googlePayload, c.var.db);

    // Step 4: JWTトークン生成
    const token = await generateJWT(user, c.env.JWT_SECRET);

    console.log('✅ Google認証完了:', user.email);

    // Step 5: レスポンス
    return c.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.displayName,
          picture: user.avatarUrl,
        },
        token,
      },
      201,
    );
  } catch (error) {
    console.error('❌ Google auth error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';

    // Google認証特有のエラー
    if (errorMessage.includes('Invalid Google token')) {
      return c.json({ error: 'Invalid Google authentication' }, 400);
    }

    if (errorMessage.includes('User search or creation failed')) {
      return c.json({ error: 'User registration failed' }, 500);
    }

    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Authorization Code + PKCE 交換エンドポイント
auth.post(
  '/google/code',
  validator('json', (value, c) => {
    if (typeof value.code !== 'string' || !value.code)
      return c.json({ error: 'code required' }, 400);
    if (typeof value.codeVerifier !== 'string' || !value.codeVerifier)
      return c.json({ error: 'codeVerifier required' }, 400);
    if (typeof value.redirectUri !== 'string' || !value.redirectUri)
      return c.json({ error: 'redirectUri required' }, 400);
    return value;
  }),
  async (c) => {
    try {
      const { code, codeVerifier, redirectUri } = c.req.valid('json');
      const { idToken } = await exchangeCodeForIdToken(
        { code, codeVerifier, redirectUri },
        c.env.GOOGLE_CLIENT_ID,
        c.env.GOOGLE_CLIENT_SECRET,
      );
      const googlePayload = await verifyGoogleToken(idToken, c.env.GOOGLE_CLIENT_ID);
      if (!googlePayload.email_verified) {
        return c.json({ error: 'Email not verified by Google' }, 400);
      }
      const user = await findOrCreateUser(googlePayload, c.var.db);
      const token = await generateJWT(user, c.env.JWT_SECRET);
      return c.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.displayName,
          picture: user.avatarUrl,
        },
        token,
        flow: 'code',
      });
    } catch (e) {
      console.error('❌ Code flow auth error:', e);
      return c.json({ error: 'Code flow authentication failed' }, 500);
    }
  },
);

/**
 * ユーザー情報取得エンドポイント
 * GET /api/auth/me
 *
 * - 認証ミドルウェアによる保護
 * - JWTからユーザー情報を取得
 * - 認証済みユーザーの情報レスポンス
 */
auth.get('/me', authMiddleware, async (c) => {
  try {
    console.log('🔍 ユーザー情報取得リクエスト');

    // 認証ミドルウェアで設定されたユーザー情報を取得
    const userPayload = getAuthenticatedUser(c);

    // DBから最新のユーザー情報を取得
    const [user] = await c.var.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userPayload.userId))
      .limit(1);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    console.log('✅ ユーザー情報取得成功:', user.email);

    return c.json({
      id: user.id,
      email: user.email,
      name: user.displayName,
      googleId: userPayload.googleId,
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    return c.json({ error: 'Failed to get user information' }, 500);
  }
});

/**
 * ログアウトエンドポイント
 * POST /api/auth/logout
 *
 * - JWTはステートレスなため、サーバー側で無効化できない
 * - クライアント側でトークン削除が主な処理
 * - 将来的にはトークンブラックリスト機能を実装予定
 */
auth.post('/logout', authMiddleware, async (c) => {
  try {
    console.log('🚪 ログアウトリクエスト');

    const userPayload = getAuthenticatedUser(c);

    console.log('✅ ログアウト処理完了:', userPayload.email);

    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

/**
 * 認証ステータス確認エンドポイント（デバッグ用）
 * GET /api/auth/status
 *
 * - 開発時のデバッグに使用
 * - 認証状態の確認
 * - 本番環境では削除を検討
 */
auth.get('/status', authMiddleware, async (c) => {
  try {
    const userPayload = getAuthenticatedUser(c);

    return c.json({
      authenticated: true,
      user: {
        id: userPayload.userId,
        email: userPayload.email,
        googleId: userPayload.googleId,
      },
      tokenInfo: {
        issuer: userPayload.iss,
        audience: userPayload.aud,
        expiresAt: userPayload.exp,
      },
    });
  } catch (error) {
    return c.json(
      {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      401,
    );
  }
});

/**
 * プロフィール更新エンドポイント
 * PUT /api/auth/profile
 */
auth.put(
  '/profile',
  authMiddleware,
  validator('json', (value, c) => {
    if (!value.displayName || typeof value.displayName !== 'string') {
      return c.json({ error: 'Display name is required' }, 400);
    }
    const trimmedName = value.displayName.trim();
    if (trimmedName.length === 0) {
      return c.json({ error: 'Display name cannot be empty' }, 400);
    }
    if (trimmedName.length > 50) {
      return c.json({ error: 'Display name must be 50 characters or less' }, 400);
    }
    // トリム済みの値を返す
    value.displayName = trimmedName;
    return value;
  }),
  async (c) => {
    try {
      const userPayload = getAuthenticatedUser(c);
      const { displayName } = c.req.valid('json');

      console.log('👤 プロフィール更新リクエスト:', userPayload.email, displayName);

      const [updatedUser] = await c.var.db
        .update(schema.users)
        .set({
          displayName: displayName,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userPayload.userId))
        .returning();

      if (!updatedUser) {
        return c.json({ error: 'User not found' }, 404);
      }

      console.log('✅ プロフィール更新完了:', updatedUser.displayName);

      return c.json({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.displayName,
      });
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return c.json({ error: 'Failed to update profile' }, 500);
    }
  },
);

export default auth;
