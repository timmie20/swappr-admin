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

const inflight = new Map<string, Promise<AuthTokens | null>>();

async function requestRefresh(
  refreshToken: string
): Promise<AuthTokens | null> {
  try {
    const res = await fetch(`${process.env.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (!data.access_token || !data.expires_at || !data.refresh_token) {
      return null;
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(data.expires_at).getTime()
    };
  } catch {
    return null;
  }
}

export function attemptRefresh(
  refreshToken: string
): Promise<AuthTokens | null> {
  const existing = inflight.get(refreshToken);
  if (existing) return existing;

  const promise = requestRefresh(refreshToken).then((tokens) => {
    if (tokens) {
      setTimeout(() => inflight.delete(refreshToken), RESULT_GRACE_MS);
    } else {
      inflight.delete(refreshToken);
    }
    return tokens;
  });

  inflight.set(refreshToken, promise);
  return promise;
}
