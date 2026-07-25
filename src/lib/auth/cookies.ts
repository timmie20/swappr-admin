import type { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { AuthTokens } from '@/types/auth';

// Admin-scoped names — mirrors swappr_vendor_* / swappr_client_* so all three
// apps can share the .swappr.com.ng domain in prod without clobbering each
// other's session.
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'swappr_admin_access',
  REFRESH_TOKEN: 'swappr_admin_refresh',
  EXPIRES_AT: 'swappr_admin_expires_at'
} as const;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax',
  path: '/',
  ...(IS_PRODUCTION && { domain: '.swappr.com.ng' })
} as const;

// ─── Setters (used after login / refresh) ──────────────────────────────────
// Refresh tokens rotate on every /auth/refresh call, so the token pair is
// always written together — never persist a new access token without the
// refresh token it was rotated with.
export function setAuthCookies(
  cookieStore: ResponseCookies | ReadonlyRequestCookies,
  tokens: AuthTokens
): void {
  const accessMaxAge = Math.max(
    0,
    Math.ceil((tokens.expires_at - Date.now()) / 1000)
  );

  cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, tokens.access_token, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: accessMaxAge
  });

  cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, tokens.refresh_token, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7
  });

  // Readable by client JS — same attributes as the tokens so it follows them
  // across subdomains, just not HttpOnly
  cookieStore.set(COOKIE_NAMES.EXPIRES_AT, String(tokens.expires_at), {
    ...BASE_COOKIE_OPTIONS,
    httpOnly: false,
    maxAge: accessMaxAge // must match access token
  });
}

// Deletion only matches a cookie whose domain/path attributes match the ones
// it was set with, so reuse BASE_COOKIE_OPTIONS here
export function clearAuthCookies(
  cookieStore: ResponseCookies | ReadonlyRequestCookies
): void {
  cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, '', {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0
  });
  cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, '', {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0
  });
  cookieStore.set(COOKIE_NAMES.EXPIRES_AT, '', {
    ...BASE_COOKIE_OPTIONS,
    httpOnly: false,
    maxAge: 0
  });
}

// ─── Getters ────────────────────────────────────────────────────────────────
// Accept the already-awaited cookie store — callers must await cookies() first

export function getAccessToken(
  cookieStore: ReadonlyRequestCookies
): string | undefined {
  return cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
}

export function getRefreshToken(
  cookieStore: ReadonlyRequestCookies
): string | undefined {
  return cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
}

export function getExpiresAt(
  cookieStore: ReadonlyRequestCookies
): number | null {
  const raw = cookieStore.get(COOKIE_NAMES.EXPIRES_AT)?.value;
  if (!raw) return null;
  const parsed = Number(raw);
  return isNaN(parsed) ? null : parsed;
}

export function isTokenExpired(
  cookieStore: ReadonlyRequestCookies,
  bufferMs = 60_000
): boolean {
  const expiresAt = getExpiresAt(cookieStore);
  if (!expiresAt) return true;
  return Date.now() >= expiresAt - bufferMs;
}

export { COOKIE_NAMES };
