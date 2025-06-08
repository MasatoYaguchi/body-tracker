// apps/frontend/src/auth/services/authApi.ts
// 認証関連API通信サービス

import type { AuthError, GoogleAuthResponse, User } from '../types/auth.types';
import { AuthenticationError } from '../types/auth.types';

// ===== 設定 =====

const API_BASE = 'http://localhost:8000/api';

/**
 * 認証API通信クライアント
 * バックエンドの認証エンドポイントとの通信を管理
 */
class authApiClient {
  private baseURL: string;

  /**
   * APIクライアントを初期化
   * @param baseURL - APIのベースURL（デフォルト: http://localhost:8000/api）
   */
  constructor(baseURL: string = API_BASE) {
    this.baseURL = baseURL;
  }

  /**
   * Google認証トークンを送信してJWTを取得
   *
   * @param credential - Google IDトークン
   * @returns Promise<GoogleAuthResponse> ユーザー情報とJWTトークン
   * @throws {AuthenticationError} 認証失敗時
   *
   * @example
   * ```typescript
   * try {
   *   const { user, token } = await authApi.authenticateWithGoogle(googleToken);
   *   console.log('Logged in as:', user.email);
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   * ```
   */
  async authenticateWithGoogle(credential: string): Promise<GoogleAuthResponse> {
    console.log('🚀 Google認証API呼び出し開始');

    try {
      const response = await fetch(`${this.baseURL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      if (!response.ok) {
        const errorData: AuthError = await response.json();
        throw new AuthenticationError(
          errorData.error || 'Authentication failed',
          'GOOGLE_AUTH_FAILED',
        );
      }

      const data: GoogleAuthResponse = await response.json();
      console.log('✅ Google認証API成功:', data.user.email);

      return data;
    } catch (error) {
      console.error('❌ Google認証API失敗:', error);

      if (error instanceof AuthenticationError) {
        throw error;
      }

      // ネットワークエラーなど
      throw new AuthenticationError('Network error during authentication', 'NETWORK_ERROR');
    }
  }

  /**
   * JWTトークンを使用して現在のユーザー情報を取得
   *
   * @param token - JWTトークン
   * @returns Promise<User> ユーザー情報
   * @throws {AuthenticationError} トークンが無効または期限切れの場合
   *
   * @example
   * ```typescript
   * try {
   *   const user = await authApi.getCurrentUser(jwtToken);
   *   console.log('Current user:', user.email);
   * } catch (error) {
   *   if (error.code === 'TOKEN_EXPIRED') {
   *     // ログイン画面にリダイレクト
   *   }
   * }
   * ```
   */
  async getCurrentUser(token: string): Promise<User> {
    console.log('🔍 ユーザー情報取得API開始');

    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Token expired or invalid', 'TOKEN_EXPIRED');
        }

        const errorData: AuthError = await response.json();
        throw new AuthenticationError(
          errorData.error || 'Failed to get user info',
          'USER_INFO_FAILED',
        );
      }

      const user: User = await response.json();
      console.log('✅ ユーザー情報取得成功:', user.email);

      return user;
    } catch (error) {
      console.error('❌ ユーザー情報取得失敗:', error);

      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError('Failed to validate user token', 'VALIDATION_ERROR');
    }
  }

  /**
   * サーバー側でログアウト処理を実行
   *
   * @param token - JWTトークン
   * @returns Promise<void>
   *
   * @note APIエラーが発生してもログアウト処理は続行されます
   *
   * @example
   * ```typescript
   * await authApi.logout(currentToken);
   * // ローカルストレージからトークンを削除
   * localStorage.removeItem('authToken');
   * ```
   */
  async logout(token: string): Promise<void> {
    console.log('🚪 ログアウトAPI開始');

    try {
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ ログアウトAPI失敗（続行）:', response.status);
        // ログアウトAPIの失敗は致命的ではない
        return;
      }

      console.log('✅ ログアウトAPI成功');
    } catch (error) {
      console.warn('⚠️ ログアウトAPIエラー（続行）:', error);
      // ネットワークエラーでもログアウト処理は続行
    }
  }

  /**
   * APIサーバーの稼働状況を確認
   *
   * @returns Promise<{status: string, version?: string}> サーバー情報
   * @throws {AuthenticationError} サーバーが利用できない場合
   *
   * @example
   * ```typescript
   * try {
   *   const health = await authApi.healthCheck();
   *   console.log('Server status:', health.status);
   * } catch (error) {
   *   console.error('Server is down:', error.message);
   * }
   * ```
   */
  async healthCheck(): Promise<{ status: string; version?: string }> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ ヘルスチェック失敗:', error);
      throw new AuthenticationError('Authentication server is not available', 'SERVER_UNAVAILABLE');
    }
  }
}

/** 認証APIクライアントのシングルトンインスタンス */
export const authApi = new authApiClient();

/**
 * Google認証関数（個別エクスポート）
 * @see authApiClient.authenticateWithGoogle
 */
export const { authenticateWithGoogle, getCurrentUser, logout, healthCheck } = authApi;

/**
 * AuthenticationErrorかどうかを判定する型ガード
 *
 * @param error - チェック対象のエラー
 * @returns AuthenticationErrorの場合true
 *
 * @example
 * ```typescript
 * try {
 *   await login(credential);
 * } catch (error) {
 *   if (isAuthenticationError(error)) {
 *     console.log('Auth error code:', error.code);
 *   }
 * }
 * ```
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * エラーから適切な日本語メッセージを生成
 *
 * @param error - エラーオブジェクト
 * @returns 日本語のエラーメッセージ
 *
 * @example
 * ```typescript
 * try {
 *   await login(credential);
 * } catch (error) {
 *   const message = getAuthErrorMessage(error);
 *   showErrorToUser(message);
 * }
 * ```
 */
export function getAuthErrorMessage(error: unknown): string {
  if (isAuthenticationError(error)) {
    switch (error.code) {
      case 'GOOGLE_AUTH_FAILED':
        return 'Google認証に失敗しました。もう一度お試しください。';
      case 'TOKEN_EXPIRED':
        return 'ログインセッションが期限切れです。再度ログインしてください。';
      case 'NETWORK_ERROR':
        return 'ネットワークエラーが発生しました。接続を確認してください。';
      case 'SERVER_UNAVAILABLE':
        return 'サーバーに接続できません。しばらく待ってからお試しください。';
      default:
        return error.message;
    }
  }

  return '不明なエラーが発生しました。';
}
