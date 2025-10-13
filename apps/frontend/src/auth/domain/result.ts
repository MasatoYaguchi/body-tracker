// Domain-level Result / Error modeling for auth flows

export type Ok<T> = { ok: true; value: T };
export type Err<E extends AuthDomainError> = { ok: false; error: E };
export type Result<T, E extends AuthDomainError = AuthDomainError> = Ok<T> | Err<E>;

export interface AuthDomainError {
  code: AuthErrorCode;
  message: string;
  cause?: unknown;
}

export type AuthErrorCode =
  | 'CODE_MISSING'
  | 'STATE_MISMATCH'
  | 'PKCE_VERIFIER_MISSING'
  | 'CODE_EXCHANGE_FAILED'
  | 'UNKNOWN';

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E extends AuthDomainError>(error: E): Err<E> {
  return { ok: false, error };
}

export function toAuthError(
  code: AuthErrorCode,
  message: string,
  cause?: unknown,
): AuthDomainError {
  return { code, message, cause };
}

export function mapError<T>(r: Result<T>, fn: (e: AuthDomainError) => AuthDomainError): Result<T> {
  if (r.ok) return r;
  return err(fn(r.error));
}
