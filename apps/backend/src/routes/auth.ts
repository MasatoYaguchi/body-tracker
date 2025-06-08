// apps/backend/src/routes/auth.ts
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { findOrCreateUser, generateJWT, verifyGoogleToken } from '../auth/google';
import { authMiddleware, getAuthenticatedUser } from '../middleware/auth';

// 認証ルーター作成
const auth = new Hono();

/**
 * Google認証リクエストのバリデーター
 *
 * 学習ポイント:
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
 * 学習ポイント:
 * - Google IDトークンの検証
 * - ユーザー作成/取得のビジネスロジック
 * - JWT生成とレスポンス
 */
auth.post('/google', googleAuthValidator, async (c) => {
  try {
    console.log('🚀 Google認証リクエスト受信');

    const { credential } = c.req.valid('json');

    // Step 1: Google認証トークンを検証
    const googlePayload = await verifyGoogleToken(credential);

    // Step 2: メール認証済みチェック
    if (!googlePayload.email_verified) {
      console.log('❌ メール未認証:', googlePayload.email);
      return c.json({ error: 'Email not verified by Google' }, 400);
    }

    // Step 3: ユーザー作成または取得
    const user = await findOrCreateUser(googlePayload);

    // Step 4: JWTトークン生成
    const token = generateJWT(user);

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

/**
 * ユーザー情報取得エンドポイント
 * GET /api/auth/me
 *
 * 学習ポイント:
 * - 認証ミドルウェアによる保護
 * - JWTからユーザー情報を取得
 * - 認証済みユーザーの情報レスポンス
 */
auth.get('/me', authMiddleware, async (c) => {
  try {
    console.log('🔍 ユーザー情報取得リクエスト');

    // 認証ミドルウェアで設定されたユーザー情報を取得
    const userPayload = getAuthenticatedUser(c);

    console.log('✅ ユーザー情報取得成功:', userPayload.email);

    // JWTペイロードから基本情報を返す
    return c.json({
      id: userPayload.userId,
      email: userPayload.email,
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
 * 学習ポイント:
 * - JWTはステートレスなため、サーバー側で無効化できない
 * - クライアント側でトークン削除が主な処理
 * - 将来的にはトークンブラックリスト機能を実装予定
 */
auth.post('/logout', authMiddleware, async (c) => {
  try {
    console.log('🚪 ログアウトリクエスト');

    const userPayload = getAuthenticatedUser(c);

    console.log('✅ ログアウト処理完了:', userPayload.email);

    // 現在はクライアント側でトークン削除
    // 将来的にはトークンブラックリスト機能を実装
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
 * 学習ポイント:
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

export default auth;
