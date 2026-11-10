import { backendHeadersForIp } from '@/lib/api/backend-headers';
import { readRateLimit, type RateLimitInfo } from '@/lib/api/rate-limit';
import type { AuthTokens } from '@/types/auth';

// Refresh tokens are one-time-use (rotation): the backend treats a second
// /auth/refresh call with an already-used token as theft and revokes ALL of
// the admin's sessions. Requests must therefore never race each other to the
// refresh endpoint with the same token.
//
// `inflight` gives us single-flight behavior per token within this server
// process. Successful results are kept for a short grace window (not deleted
// immediately) because a request that left the browser before the rotation
// landed still carries the old refresh cookie — it must receive the already
// rotated pair rather than burn the stale token.
const RESULT_GRACE_MS = 30_000;

// "rate_limited" is a 429: the backend turned the request away before
// redeeming the token, so the session is still alive and the cookies must
// stay. Every other failure means the session is dead.
export type RefreshResult =
  | { status: 'ok'; tokens: AuthTokens }
  | ({ status: 'rate_limited' } & RateLimitInfo)
  | { status: 'failed' };

const inflight = new Map<string, Promise<RefreshResult>>();

async function requestRefresh(
  refreshToken: string,
  clientIp: string | null
): Promise<RefreshResult> {
  try {
    const res = await fetch(`${process.env.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...backendHeadersForIp(clientIp)
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (res.status === 429) {
      return { status: 'rate_limited', ...(await readRateLimit(res)) };
    }

    if (!res.ok) return { status: 'failed' };

    const data = await res.json();

    // The rotated refresh_token is mandatory — without it the next refresh
    // would reuse the old token and revoke every session
    if (!data.access_token || !data.expires_at || !data.refresh_token) {
      return { status: 'failed' };
    }

    return {
      status: 'ok',
      tokens: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(data.expires_at).getTime()
      }
    };
  } catch {
    return { status: 'failed' };
  }
}

/** `clientIp` is the visitor's IP (see getClientIp), forwarded for rate limits */
export function attemptRefresh(
  refreshToken: string,
  clientIp: string | null
): Promise<RefreshResult> {
  const existing = inflight.get(refreshToken);
  if (existing) return existing;

  const promise = requestRefresh(refreshToken, clientIp).then((result) => {
    if (result.status === 'ok') {
      setTimeout(() => inflight.delete(refreshToken), RESULT_GRACE_MS);
    } else {
      // Failures are not cached. A "failed" rotation means the session is
      // dead; a "rate_limited" one keeps the token, which works again later.
      inflight.delete(refreshToken);
    }
    return result;
  });

  inflight.set(refreshToken, promise);
  return promise;
}
