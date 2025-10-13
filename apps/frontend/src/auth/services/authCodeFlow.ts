// Application layer: Google Authorization Code + PKCE flow coordination
// Orchestrates between PKCE helpers, storage and API.

import { type Result, err, ok, toAuthError } from '../domain/result';
import { buildAuthorizationUrl, generatePkcePair } from '../utils/pkce';
import { exchangeAuthorizationCode } from './authApi';
import { authStorage } from './authStorage';

const PKCE_VERIFIER_KEY = 'pkce_verifier';

export interface StartLoginOptions {
  clientId: string;
  redirectUri: string;
  state?: string;
}

export async function startPkceLogin({
  clientId,
  redirectUri,
  state = 'login',
}: StartLoginOptions): Promise<void> {
  const { verifier, challenge } = await generatePkcePair();
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  const url = buildAuthorizationUrl({ clientId, redirectUri, codeChallenge: challenge, state });
  window.location.assign(url);
}

export async function handleAuthCallback(currentUrl: string): Promise<Result<null>> {
  const url = new URL(currentUrl, window.location.origin);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code) return err(toAuthError('CODE_MISSING', 'code missing'));
  if (state !== 'login') return err(toAuthError('STATE_MISMATCH', 'state mismatch'));
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (!verifier)
    return err(toAuthError('PKCE_VERIFIER_MISSING', 'verifier missing (restart login)'));
  try {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const { user, token } = await exchangeAuthorizationCode({
      code,
      codeVerifier: verifier,
      redirectUri,
    });
    authStorage.saveAuthData({ user, token });
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    return ok(null);
  } catch (e) {
    return err(
      toAuthError('CODE_EXCHANGE_FAILED', (e as Error).message || 'code exchange failed', e),
    );
  }
}
