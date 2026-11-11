import 'server-only';

import { NextResponse } from 'next/server';
import { parseRetryAfter, rateLimitedJson } from './rate-limit';
import type { AuthTokens } from '@/types/auth';

// Shared by the route handlers that proxy the backend's sign-in routes
// (login and the MFA steps), so every step answers the page the same way.

export const UNAVAILABLE_MESSAGE =
  'Sign-in is unavailable right now. Please try again later.';

/** The backend's error body, read once */
export type BackendBody = Record<string, unknown>;

export async function readBody(res: Response): Promise<BackendBody> {
  const data = await res.json().catch(() => null);
  return data && typeof data === 'object' ? (data as BackendBody) : {};
}

const messageOf = (body: BackendBody, fallback: string): string => {
  const { message } = body;
  if (Array.isArray(message)) return message.join('. ');
  return typeof message === 'string' && message ? message : fallback;
};

/**
 * Turns a failed backend response into the page's response. The backend's
 * message is written for the admin, so it's passed through; `code` and
 * `attempts_left` come along for the page to switch on.
 */
export function backendErrorResponse(
  res: Response,
  body: BackendBody,
  fallback: string
): NextResponse {
  const code = typeof body.code === 'string' ? body.code : undefined;

  // The per-visitor limit. MFA_LOCKED is also a 429 but has no wait time:
  // it goes through as itself so the page can return to the password step.
  if (res.status === 429 && code !== 'MFA_LOCKED') {
    const { body: json, init } = rateLimitedJson({
      message: messageOf(body, 'Too many attempts. Please wait and try again.'),
      retryAfterSeconds: parseRetryAfter(body, res.headers.get('Retry-After'))
    });
    return NextResponse.json(json, init);
  }

  // A missing or mismatched BFF_SHARED_SECRET, not anything the admin did
  if (code === 'BFF_ONLY') {
    console.error(
      'Backend refused a sign-in call with BFF_ONLY: check BFF_SHARED_SECRET'
    );
    return NextResponse.json(
      { code: 'BFF_ONLY', message: UNAVAILABLE_MESSAGE },
      { status: 503 }
    );
  }

  // Redis down: MFA fails closed
  if (res.status === 503) {
    return NextResponse.json(
      { code: 'UNAVAILABLE', message: messageOf(body, UNAVAILABLE_MESSAGE) },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      ...(code ? { code } : {}),
      message: messageOf(body, fallback),
      ...(typeof body.attempts_left === 'number'
        ? { attempts_left: body.attempts_left }
        : {})
    },
    { status: res.status }
  );
}

/** The session pair from an AuthResponse; null if any part is missing */
export function parseAuthTokens(body: BackendBody): AuthTokens | null {
  const { access_token, refresh_token, expires_at } = body;
  if (
    typeof access_token !== 'string' ||
    !access_token ||
    typeof refresh_token !== 'string' ||
    !refresh_token ||
    (typeof expires_at !== 'string' && typeof expires_at !== 'number')
  ) {
    return null;
  }
  const expiresAt = new Date(expires_at).getTime();
  if (Number.isNaN(expiresAt)) return null;
  return { access_token, refresh_token, expires_at: expiresAt };
}

export function invalidAuthServerResponse(): NextResponse {
  return NextResponse.json(
    { message: 'Invalid response from auth server' },
    { status: 500 }
  );
}
