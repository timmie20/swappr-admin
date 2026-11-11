import type { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

// The single-use ticket admin login hands out instead of a session, kept
// between the password step and the code step. The browser never reads it:
// httpOnly, sent only to /api/auth/mfa/*, and no domain, so only this app
// (not the vendor app or storefront on .swappr.com.ng) ever gets it.
export const MFA_TICKET_COOKIE = 'swappr_admin_mfa_ticket';

const TICKET_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth/mfa'
} as const;

// Code step tickets last 5 minutes, setup tickets 15
const FALLBACK_MAX_AGE_SECONDS = 5 * 60;
const MAX_TICKET_AGE_SECONDS = 15 * 60;

type CookieStore = ResponseCookies | ReadonlyRequestCookies;

/** Seconds until the backend's expires_at, within sane bounds */
export function ticketMaxAge(expiresAt: unknown, now = Date.now()): number {
  const ms =
    typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : NaN;
  if (Number.isNaN(ms)) return FALLBACK_MAX_AGE_SECONDS;
  return Math.min(
    MAX_TICKET_AGE_SECONDS,
    Math.max(0, Math.ceil((ms - now) / 1000))
  );
}

export function setMfaTicket(
  cookieStore: CookieStore,
  ticket: string,
  expiresAt: unknown
): void {
  cookieStore.set(MFA_TICKET_COOKIE, ticket, {
    ...TICKET_COOKIE_OPTIONS,
    maxAge: ticketMaxAge(expiresAt)
  });
}

export function getMfaTicket(
  cookieStore: ReadonlyRequestCookies
): string | undefined {
  return cookieStore.get(MFA_TICKET_COOKIE)?.value || undefined;
}

// Deletion only matches a cookie set with the same path
export function clearMfaTicket(cookieStore: CookieStore): void {
  cookieStore.set(MFA_TICKET_COOKIE, '', {
    ...TICKET_COOKIE_OPTIONS,
    maxAge: 0
  });
}
