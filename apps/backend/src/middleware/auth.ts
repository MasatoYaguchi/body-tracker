import type { Context, Next } from 'hono';
import type { JwtPayload } from 'jsonwebtoken';
import { verifyJWT } from '../auth/google';
import type { Bindings } from '../types';

// 認証済みユーザーのJWTペイロード型定義
interface AuthenticatedUser extends JwtPayload {
  userId: string;
  email: string;
  googleId: string;
}

/**
 * 認証ミドルウェア
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    console.log('🔐 認証ミドルウェア実行中...');

    // Step 1: Authorizationヘッダーの取得
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      console.log('❌ Authorizationヘッダーがありません');
      return c.json({ error: 'Authorization header required' }, 401);
    }

    // Step 2: Bearer トークンの抽出
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Bearer形式ではありません:', authHeader.substring(0, 20));
      return c.json({ error: 'Bearer token required' }, 401);
    }

    const token = authHeader.substring(7); // "Bearer " を除去

    if (!token) {
      console.log('❌ トークンが空です');
      return c.json({ error: 'Token is empty' }, 401);
    }

    // Step 3: JWTトークンの検証
    const env = c.env as Bindings;
    const decoded = verifyJWT(token, env.JWT_SECRET);

    // Step 4: 型ガード - JwtPayloadであることを確認
    if (typeof decoded === 'string') {
      console.log('❌ JWT検証結果が文字列です');
      return c.json({ error: 'Invalid token format' }, 401);
    }

    // Step 5: ユーザー情報をコンテキストに設定
    c.set('user', decoded as AuthenticatedUser);

    console.log('✅ 認証成功 - ユーザー:', decoded.email);

    // Step 6: 次のミドルウェア/ハンドラーに進む
    await next();
  } catch (error) {
    console.error('❌ 認証ミドルウェアエラー:', error);

    // JWTエラーの種類に応じたレスポンス
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';

    if (errorMessage.includes('expired')) {
      return c.json({ error: 'Token has expired. Please login again.' }, 401);
    }

    if (errorMessage.includes('Invalid token')) {
      return c.json({ error: 'Invalid token. Please login again.' }, 401);
    }

    return c.json({ error: 'Authentication failed' }, 401);
  }
}

/**
 * 認証が必要なAPIでユーザー情報を取得するヘルパー関数
 */
export function getAuthenticatedUser(c: Context): AuthenticatedUser {
  const user = c.get('user') as AuthenticatedUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user;
}

/**
 * オプショナル認証ミドルウェア
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (token) {
        const env = c.env as Bindings;
        const decoded = verifyJWT(token, env.JWT_SECRET);

        // 型ガード
        if (typeof decoded !== 'string') {
          c.set('user', decoded as AuthenticatedUser);
          console.log('✅ オプショナル認証成功:', decoded.email);
        }
      }
    }
  } catch (error) {
    console.log(
      'ℹ️ オプショナル認証失敗（続行）:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    // エラーでも処理は続行
  }

  await next();
}

// 型エクスポート
export type { AuthenticatedUser };
