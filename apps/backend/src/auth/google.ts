// apps/backend/src/auth/google.ts
import { OAuth2Client } from 'google-auth-library';
import jwt, { type JwtPayload } from 'jsonwebtoken';

// Google OAuth2クライアントの初期化
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google認証から取得される情報の型定義
export interface GoogleTokenPayload {
  sub: string; // Google ID（ユニークな識別子）
  email: string; // メールアドレス
  name: string; // 表示名
  picture?: string; // プロフィール画像URL
  email_verified: boolean; // メール認証済みかどうか
}

// アプリ内で使用するユーザー情報の型定義
export interface AuthUser {
  id: string; // 内部ユーザーID
  email: string; // メールアドレス
  username: string; // ユーザー名
  displayName: string; // 表示名
  avatarUrl?: string; // アバター画像URL
  googleId: string; // Google ID
}

/**
 * Google認証トークンの検証
 *
 * 学習ポイント:
 * - Google IDトークンはJWT形式で署名されている
 * - Google公開鍵で署名を検証することで改ざんを防ぐ
 * - 有効期限や発行者も自動で検証される
 */
export async function verifyGoogleToken(credential: string): Promise<GoogleTokenPayload> {
  try {
    console.log('🔍 Google認証トークンを検証中...');

    // Google OAuth2Clientを使用してトークン検証
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID, // このアプリ宛てのトークンかチェック
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token payload');
    }

    console.log('✅ Google認証トークンの検証成功:', {
      email: payload.email,
      name: payload.name,
      verified: payload.email_verified,
    });

    return {
      sub: payload.sub,
      email: payload.email ?? 'no email',
      name: payload.name ?? 'no name',
      picture: payload.picture,
      email_verified: !!payload.email_verified,
    };
  } catch (error) {
    console.error('❌ Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }
}

/**
 * ユーザー作成または取得
 *
 * 学習ポイント:
 * - 既存ユーザーかどうかをメールアドレスで検索
 * - 新規ユーザーの場合はデータベースに作成
 * - Drizzle ORMでの型安全なデータベース操作
 */
export async function findOrCreateUser(googlePayload: GoogleTokenPayload): Promise<AuthUser> {
  // データベース接続とスキーマをインポート（後で追加）
  const { db } = await import('../db/connection');
  const { users } = await import('../db/schema');
  const { eq } = await import('drizzle-orm');

  try {
    console.log('🔍 ユーザー検索中:', googlePayload.email);

    // Step 1: 既存ユーザーを検索（メールアドレスで）
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, googlePayload.email))
      .limit(1);

    // Step 2: 既存ユーザーが見つかった場合
    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      console.log('✅ 既存ユーザーを発見:', user.email);

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: googlePayload.name, // Googleから最新情報を使用
        avatarUrl: googlePayload.picture, // Googleから最新情報を使用
        googleId: googlePayload.sub,
      };
    }

    // Step 3: 新規ユーザー作成
    console.log('👤 新規ユーザーを作成中:', googlePayload.email);

    const [newUser] = await db
      .insert(users)
      .values({
        // idは自動生成されるため省略
        username: `user_${Date.now()}`,
        email: googlePayload.email,
      })
      .returning();

    console.log('✅ 新規ユーザー作成完了:', newUser.email);

    return {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      displayName: googlePayload.name,
      avatarUrl: googlePayload.picture,
      googleId: googlePayload.sub,
    };
  } catch (error) {
    console.error('❌ ユーザー検索または作成中にエラー:', error);
    throw new Error('User search or creation failed');
  }
}
/**
 * JWT（JSON Web Token）生成
 *
 * 学習ポイント:
 * - JWTは署名付きトークンで改ざんを検出できる
 * - ペイロードには秘密情報を入れない（誰でも読める）
 * - 有効期限を設定してセキュリティを向上
 */
export function generateJWT(user: AuthUser): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  console.log('🔐 JWT生成中:', user.email);

  // JWTペイロード（公開情報のみ）
  const payload = {
    userId: user.id,
    email: user.email,
    googleId: user.googleId,
    // 注意: パスワードや機密情報は含めない
  };

  // JWT署名オプション（型を明示的に指定）
  const options: jwt.SignOptions = {
    expiresIn: '30d', // 30日間有効
    issuer: 'body-tracker', // 発行者
    audience: 'body-tracker-users', // 対象者
  };

  const token = jwt.sign(payload, jwtSecret, options);

  console.log('✅ JWT生成完了');
  return token;
}

/**
 * JWT検証
 *
 * 学習ポイント:
 * - 署名検証で改ざんを検出
 * - 有効期限の自動チェック
 * - 発行者・対象者の検証
 */
export function verifyJWT(token: string): string | JwtPayload {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    console.log('🔍 JWT検証中...');

    // JWT検証オプション
    const options = {
      issuer: 'body-tracker',
      audience: 'body-tracker-users',
    };

    const decoded = jwt.verify(token, jwtSecret, options);

    console.log('✅ JWT検証成功:', typeof decoded === 'string' ? decoded : decoded?.email);
    return decoded;
  } catch (error) {
    console.error('❌ JWT verification failed:', error);

    // エラーの種類に応じた詳細メッセージ
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}
