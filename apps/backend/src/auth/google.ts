import { eq } from 'drizzle-orm';
// apps/backend/src/auth/google.ts
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { sign, verify } from 'hono/jwt';
import * as schema from '../db/schema';

// Google認証から取得される情報の型定義
export interface GoogleTokenPayload {
  sub: string; // Google ID（ユニークな識別子）
  email: string; // メールアドレス
  name: string; // 表示名
  picture?: string; // プロフィール画像URL
  email_verified: boolean; // メール認証済みかどうか
}

interface GoogleTokenInfo {
  aud: string;
  email: string;
  email_verified: string | boolean;
  name: string;
  picture?: string;
  sub: string;
  [key: string]: unknown;
}

interface GoogleTokenResponse {
  id_token: string;
  refresh_token?: string;
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  googleId: string;
  iss: string;
  aud: string;
  exp: number;
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
 */
export async function verifyGoogleToken(
  credential: string,
  clientId: string,
): Promise<GoogleTokenPayload> {
  try {
    console.log('🔍 Google認証トークンを検証中...');

    // Googleのtokeninfoエンドポイントを使用して検証
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);

    if (!response.ok) {
      throw new Error('Failed to verify token with Google');
    }

    const payload = (await response.json()) as GoogleTokenInfo;

    if (payload.aud !== clientId) {
      throw new Error('Token audience mismatch');
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
      email_verified: payload.email_verified === 'true' || payload.email_verified === true,
    };
  } catch (error) {
    console.error('❌ Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }
}

/**
 * Authorization Code + PKCE で受け取った code を Google Token Endpoint で交換し
 * id_token を取得する
 */
export async function exchangeCodeForIdToken(
  params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  },
  clientId: string,
  clientSecret: string,
): Promise<{ idToken: string; refreshToken?: string }> {
  const { code, codeVerifier, redirectUri } = params;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth client credentials not set');
  }

  // redirectUri の簡易バリデーション
  const allowedOrigins = [
    /^http:\/\/localhost:3000\/(gsi-test\.html|auth\/callback)$/,
    /^https:\/\/body-tracker\.pages\.dev\/auth\/callback$/,
    /^https:\/\/[a-z0-9-]+\.body-tracker\.pages\.dev\/auth\/callback$/, // Preview URLs
  ];

  if (!allowedOrigins.some((pattern) => pattern.test(redirectUri))) {
    throw new Error('Invalid redirectUri');
  }

  try {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Token Endpoint Error:', errorText);
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const tokens = (await response.json()) as GoogleTokenResponse;

    const idToken = tokens.id_token;
    if (!idToken) {
      throw new Error('No id_token returned from Google');
    }

    return { idToken, refreshToken: tokens.refresh_token };
  } catch (e) {
    console.error('❌ Code exchange failed', e);
    throw new Error('Code exchange failed');
  }
}

/**
 * ユーザー作成または取得
 */
export async function findOrCreateUser(
  googlePayload: GoogleTokenPayload,
  db: NeonHttpDatabase<typeof schema>,
): Promise<AuthUser> {
  try {
    console.log('🔍 ユーザー検索中:', googlePayload.email);

    // Step 1: 既存ユーザーを検索（メールアドレスで）
    const existingUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, googlePayload.email))
      .limit(1);

    // Step 2: 既存ユーザーが見つかった場合
    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      console.log('✅ 既存ユーザーを発見:', user.email);

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName || googlePayload.name, // DBの値があればそれを使用、なければGoogleの情報
        avatarUrl: googlePayload.picture, // Googleから最新情報を使用
        googleId: googlePayload.sub,
      };
    }

    // Step 3: 新規ユーザー作成
    console.log('👤 新規ユーザーを作成中:', googlePayload.email);

    const [newUser] = await db
      .insert(schema.users)
      .values({
        // idは自動生成されるため省略
        username: `user_${Date.now()}`,
        email: googlePayload.email,
        displayName: googlePayload.name, // 初期値としてGoogleの名前を保存
      })
      .returning();

    console.log('✅ 新規ユーザー作成完了:', newUser.email);

    return {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      displayName: newUser.displayName || googlePayload.name,
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
 */
export async function generateJWT(user: AuthUser, jwtSecret: string): Promise<string> {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  console.log('🔐 JWT生成中:', user.email);

  // JWTペイロード（公開情報のみ）
  const payload = {
    userId: user.id,
    email: user.email,
    googleId: user.googleId,
    // 標準クレーム
    iss: 'body-tracker',
    aud: 'body-tracker-users',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30日間有効
  };

  const token = await sign(payload, jwtSecret);

  console.log('✅ JWT生成完了');
  return token;
}

/**
 * JWT検証
 */
export async function verifyJWT(token: string, jwtSecret: string): Promise<JWTPayload> {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    console.log('🔍 JWT検証中...');

    const decoded = (await verify(token, jwtSecret)) as unknown as JWTPayload;

    console.log('✅ JWT検証成功:', decoded.email);
    return decoded;
  } catch (error) {
    console.error('❌ JWT verification failed:', error);
    throw new Error('Token verification failed');
  }
}
