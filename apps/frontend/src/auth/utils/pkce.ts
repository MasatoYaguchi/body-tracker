// Minimal PKCE helpers (domain-agnostic)

export interface PkcePair {
  verifier: string;
  challenge: string;
}

export async function generatePkcePair(): Promise<PkcePair> {
  const random = crypto.getRandomValues(new Uint8Array(32));
  // Base64URL of random bytes (as verifier)
  const verifier = base64Url(random);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64Url(new Uint8Array(digest));
  return { verifier, challenge };
}

export interface AuthUrlParams {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
  scope?: string;
  prompt?: string;
}

export function buildAuthorizationUrl({
  clientId,
  redirectUri,
  codeChallenge,
  state = 'login',
  scope = 'openid email profile',
  prompt = 'consent',
}: AuthUrlParams): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function base64Url(bytes: Uint8Array): string {
  // Standard base64
  const bin = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  const b64 = btoa(bin);
  // URL safe
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
