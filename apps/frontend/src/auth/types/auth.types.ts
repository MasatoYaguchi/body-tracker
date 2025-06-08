// apps/frontend/src/auth/types/auth.types.ts
// 認証関連の型定義

/**
 * ユーザー情報インターフェース
 * Google OAuth認証から取得される基本的なユーザーデータ
 */
export interface User {
  /** ユーザーの一意識別子 */
  id: string;
  /** メールアドレス（必須） */
  email: string;
  /** 表示名（オプション） */
  name?: string;
  /** プロフィール画像URL（オプション） */
  picture?: string;
}

/**
 * 認証状態インターフェース
 * アプリケーション全体の認証状態を管理
 */
export interface AuthState {
  /** 現在のユーザー情報（未認証時はnull） */
  user: User | null;
  /** 認証済みかどうか */
  isAuthenticated: boolean;
  /** 認証処理中かどうか */
  isLoading: boolean;
  /** JWTトークン（未認証時はnull） */
  token: string | null;
}

/**
 * 認証Context型定義
 * React ContextでプロバイダーするすべてのAPIを含む
 *
 * @extends AuthState
 */
export interface AuthContextType extends AuthState {
  /**
   * Google認証実行
   * @param credential - Google IDトークン
   * @throws {AuthenticationError} 認証失敗時
   */
  login: (credential: string) => Promise<void>;
  /**
   * ログアウト実行
   * @throws {AuthenticationError} ログアウト失敗時
   */
  logout: () => Promise<void>;
  /** 🆕 React 19: useTransitionによる処理中状態 */
  isTransitioning: boolean;
}

/**
 * Google認証APIレスポンス
 * バックエンドからの認証成功レスポンス形式
 */
export interface GoogleAuthResponse {
  /** 認証されたユーザー情報 */
  user: User;
  /** 発行されたJWTトークン */
  token: string;
}

/**
 * 認証エラーレスポンス
 * バックエンドからのエラーレスポンス形式
 */
export interface AuthError {
  /** エラーメッセージ */
  error: string;
  /** 詳細メッセージ（オプション） */
  message?: string;
}

/**
 * ローカルストレージ保存データ
 * クライアント側で永続化する認証情報
 */
export interface StoredAuthData {
  /** JWTトークン */
  token: string;
  /** ユーザー情報 */
  user: User;
  /** トークン有効期限（Unix timestamp、将来の拡張用） */
  expiresAt?: number;
}

/**
 * 認証アクション関数セット
 * ログイン/ログアウト処理のみを提供するインターフェース
 */
export interface AuthActions {
  /**
   * Google認証実行
   * @param credential - Google IDトークン
   */
  login: (credential: string) => Promise<void>;
  /** ログアウト実行 */
  logout: () => Promise<void>;
}

/**
 * 条件付きレンダリングヘルパー
 * 認証状態に応じたコンポーネント表示制御
 */
export interface AuthConditionalRender {
  /**
   * 認証済みユーザーにのみ表示
   * @param component - 表示するコンポーネント
   * @returns 認証済みの場合はコンポーネント、未認証の場合はnull
   */
  showForAuth: (component: React.ReactNode) => React.ReactNode | null;
  /**
   * 未認証ユーザーにのみ表示
   * @param component - 表示するコンポーネント
   * @returns 未認証の場合はコンポーネント、認証済みの場合はnull
   */
  showForGuest: (component: React.ReactNode) => React.ReactNode | null;
  /**
   * ローディング中にのみ表示
   * @param component - 表示するコンポーネント
   * @returns ローディング中の場合はコンポーネント、それ以外はnull
   */
  showWhileLoading: (component: React.ReactNode) => React.ReactNode | null;
}

/**
 * 認証エラークラス
 * 認証関連のエラーを統一的に処理するためのカスタムエラー
 *
 * @extends Error
 * @example
 * ```typescript
 * throw new AuthenticationError('Invalid credentials', 'INVALID_CREDENTIAL');
 * ```
 */
export class AuthenticationError extends Error {
  /**
   * @param message - エラーメッセージ
   * @param code - エラーコード（オプション）
   */
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * トークン検証エラークラス
 * JWTトークンの検証失敗時に使用
 *
 * @extends Error
 */
export class TokenValidationError extends Error {
  /**
   * @param message - エラーメッセージ
   */
  constructor(message: string) {
    super(message);
    this.name = 'TokenValidationError';
  }
}

/**
 * ローカルストレージキー定数
 * 認証情報を保存する際のキー名を統一管理
 */
export const AUTH_STORAGE_KEYS = {
  /** JWTトークン保存キー */
  TOKEN: 'authToken',
  /** ユーザー情報保存キー */
  USER: 'authUser',
  /** トークン有効期限保存キー */
  EXPIRES_AT: 'authExpiresAt',
} as const;

/**
 * 認証エラーコード定数
 * エラーの種類を識別するためのコード集
 */
export const AUTH_ERRORS = {
  /** 無効な認証情報 */
  INVALID_CREDENTIAL: 'INVALID_CREDENTIAL',
  /** ネットワークエラー */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** トークン期限切れ */
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  /** 認証されていない */
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

/**
 * User型のタイプガード
 * 未知のオブジェクトがUser型かどうかをチェック
 *
 * @param value - チェック対象の値
 * @returns valueがUser型の場合true
 *
 * @example
 * ```typescript
 * const data = JSON.parse(localStorage.getItem('user') || '{}');
 * if (isUser(data)) {
 *   console.log(data.email); // 型安全にアクセス可能
 * }
 * ```
 */
export function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).email === 'string'
  );
}

/**
 * AuthState型のタイプガード
 * 未知のオブジェクトがAuthState型かどうかをチェック
 *
 * @param value - チェック対象の値
 * @returns valueがAuthState型の場合true
 */
export function isAuthState(value: unknown): value is AuthState {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AuthState).isAuthenticated === 'boolean' &&
    typeof (value as AuthState).isLoading === 'boolean'
  );
}
