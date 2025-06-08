// apps/frontend/src/auth/services/authStorage.ts
// 認証情報のローカルストレージ管理

import type { StoredAuthData, User } from '../types/auth.types';
import { AUTH_STORAGE_KEYS, isUser } from '../types/auth.types';

/**
 * 認証情報のローカルストレージ管理サービス
 * JWTトークンとユーザー情報の永続化を安全に管理
 */
class AuthStorageService {
  /**
   * JWTトークンを保存
   *
   * @param token - JWTトークン
   * @throws {Error} ストレージ保存に失敗した場合
   *
   * @example
   * ```typescript
   * try {
   *   authStorage.saveToken(jwtToken);
   * } catch (error) {
   *   console.error('Failed to save token:', error);
   * }
   * ```
   */
  saveToken(token: string): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
      console.log('✅ トークン保存完了');
    } catch (error) {
      console.error('❌ トークン保存失敗:', error);
      throw new Error('Failed to save authentication token');
    }
  }

  /**
   * JWTトークンを取得
   *
   * @returns 保存されたトークンまたはnull
   *
   * @example
   * ```typescript
   * const token = authStorage.getToken();
   * if (token) {
   *   // API呼び出しにトークンを使用
   *   api.setAuthHeader(token);
   * }
   * ```
   */
  getToken(): string | null {
    try {
      const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);

      if (token) {
        console.log('🔍 保存されたトークンを発見');
        return token;
      }

      return null;
    } catch (error) {
      console.error('❌ トークン取得失敗:', error);
      return null;
    }
  }

  /**
   * JWTトークンを削除
   *
   * @example
   * ```typescript
   * // ログアウト処理
   * authStorage.removeToken();
   * authStorage.removeUser();
   * ```
   */
  removeToken(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
      console.log('🗑️ トークン削除完了');
    } catch (error) {
      console.error('❌ トークン削除失敗:', error);
    }
  }

  /**
   * ユーザー情報を保存
   *
   * @param user - ユーザー情報
   * @throws {Error} ストレージ保存に失敗した場合
   *
   * @example
   * ```typescript
   * const user = { id: '123', email: 'user@example.com', name: 'User' };
   * authStorage.saveUser(user);
   * ```
   */
  saveUser(user: User): void {
    try {
      const userData = JSON.stringify(user);
      localStorage.setItem(AUTH_STORAGE_KEYS.USER, userData);
      console.log('✅ ユーザー情報保存完了:', user.email);
    } catch (error) {
      console.error('❌ ユーザー情報保存失敗:', error);
      throw new Error('Failed to save user information');
    }
  }

  /**
   * ユーザー情報を取得
   *
   * @returns 保存されたユーザー情報またはnull
   *
   * @note 型ガードによる安全性チェックを含む
   * 無効なデータが検出された場合は自動的に削除される
   *
   * @example
   * ```typescript
   * const user = authStorage.getUser();
   * if (user) {
   *   console.log('Welcome back,', user.name);
   * }
   * ```
   */
  getUser(): User | null {
    try {
      const userData = localStorage.getItem(AUTH_STORAGE_KEYS.USER);

      if (!userData) {
        return null;
      }

      const parsedUser = JSON.parse(userData);

      // 型ガードで安全性確保
      if (isUser(parsedUser)) {
        console.log('🔍 保存されたユーザー情報を発見:', parsedUser.email);
        return parsedUser;
      }

      console.warn('⚠️ 無効なユーザーデータ形式、削除します');
      this.removeUser();
      return null;
    } catch (error) {
      console.error('❌ ユーザー情報取得失敗:', error);
      this.removeUser(); // 破損データを削除
      return null;
    }
  }

  /**
   * ユーザー情報を削除
   */
  removeUser(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      console.log('🗑️ ユーザー情報削除完了');
    } catch (error) {
      console.error('❌ ユーザー情報削除失敗:', error);
    }
  }

  /**
   * 認証情報をまとめて保存
   *
   * @param data - 認証データ（トークン、ユーザー情報、有効期限）
   * @throws {Error} 保存に失敗した場合、全データを削除してエラーを再throw
   *
   * @example
   * ```typescript
   * const authData = {
   *   token: 'jwt_token_here',
   *   user: { id: '123', email: 'user@example.com' },
   *   expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30日後
   * };
   * authStorage.saveAuthData(authData);
   * ```
   */
  saveAuthData(data: StoredAuthData): void {
    try {
      this.saveToken(data.token);
      this.saveUser(data.user);

      if (data.expiresAt) {
        localStorage.setItem(AUTH_STORAGE_KEYS.EXPIRES_AT, data.expiresAt.toString());
      }

      console.log('✅ 認証データ一括保存完了');
    } catch (error) {
      console.error('❌ 認証データ保存失敗:', error);
      // 部分的な保存でエラーが発生した場合、全て削除
      this.clearAll();
      throw error;
    }
  }

  /**
   * 認証情報をまとめて取得
   *
   * @returns 保存された認証データまたはnull
   *
   * @note 不完全なデータ（トークンまたはユーザー情報の一方のみ）が
   * 検出された場合は全データを削除してnullを返す
   *
   * @example
   * ```typescript
   * const authData = authStorage.getAuthData();
   * if (authData) {
   *   const { token, user, expiresAt } = authData;
   *   // 認証データを使用
   * }
   * ```
   */
  getAuthData(): StoredAuthData | null {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      // 不完全なデータの場合は全て削除
      if (token || user) {
        console.warn('⚠️ 不完全な認証データを検出、削除します');
        this.clearAll();
      }
      return null;
    }

    const expiresAtStr = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRES_AT);
    const expiresAt = expiresAtStr ? Number.parseInt(expiresAtStr, 10) : undefined;

    return {
      token,
      user,
      expiresAt,
    };
  }

  /**
   * 全ての認証情報を削除
   *
   * @example
   * ```typescript
   * // ログアウト処理
   * authStorage.clearAll();
   * ```
   */
  clearAll(): void {
    try {
      this.removeToken();
      this.removeUser();
      localStorage.removeItem(AUTH_STORAGE_KEYS.EXPIRES_AT);
      console.log('🗑️ 全認証データ削除完了');
    } catch (error) {
      console.error('❌ 認証データ削除失敗:', error);
    }
  }

  // ===== ユーティリティ =====

  /**
   * 認証データの存在確認
   *
   * @returns 完全な認証データが存在するかどうか
   */
  hasValidAuthData(): boolean {
    return this.getAuthData() !== null;
  }

  /**
   * トークンの期限チェック（将来拡張用）
   *
   * @returns トークンが有効かどうか
   */
  isTokenValid(): boolean {
    const authData = this.getAuthData();

    if (!authData) {
      return false;
    }

    // 期限が設定されている場合のチェック
    if (authData.expiresAt) {
      const now = Date.now();
      if (now >= authData.expiresAt) {
        console.log('⏰ トークンが期限切れです');
        this.clearAll();
        return false;
      }
    }

    return true;
  }

  /**
   * ストレージの使用状況確認（デバッグ用）
   */
  getStorageInfo(): {
    hasToken: boolean;
    hasUser: boolean;
    hasExpiry: boolean;
    userEmail?: string;
  } {
    const token = this.getToken();
    const user = this.getUser();
    const expiresAt = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRES_AT);

    return {
      hasToken: !!token,
      hasUser: !!user,
      hasExpiry: !!expiresAt,
      userEmail: user?.email,
    };
  }
}

// ===== シングルトンインスタンス =====

export const authStorage = new AuthStorageService();

// ===== 個別関数エクスポート =====

export const {
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  removeUser,
  saveAuthData,
  getAuthData,
  clearAll,
  hasValidAuthData,
  isTokenValid,
  getStorageInfo,
} = authStorage;
