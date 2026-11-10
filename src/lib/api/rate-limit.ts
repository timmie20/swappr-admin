// The backend's auth limits (login, refresh) answer 429 { statusCode,
// code: "RATE_LIMITED", message, retry_after_seconds } with a Retry-After
// header. It's temporary: show the message, never retry on our own (that only
// extends the lockout), and never treat it as a dead session.
export const RATE_LIMITED_CODE = 'RATE_LIMITED';

export const RATE_LIMITED_FALLBACK_MESSAGE =
  'Too many attempts. Please wait a moment and try again.';

export interface RateLimitInfo {
  message: string;
  retryAfterSeconds: number | null;
}

/** Seconds from the body, else the Retry-After header; null if neither */
export function parseRetryAfter(
  body: unknown,
  header: string | null
): number | null {
  const fromBody = (body as { retry_after_seconds?: unknown } | null)
    ?.retry_after_seconds;
  if (typeof fromBody === 'number' && Number.isFinite(fromBody)) {
    return Math.max(0, Math.ceil(fromBody));
  }
  // Retry-After is either delta-seconds or an HTTP date
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
    const date = Date.parse(header);
    if (!Number.isNaN(date)) {
      return Math.max(0, Math.ceil((date - Date.now()) / 1000));
    }
  }
  return null;
}

/** Message and wait time from a backend 429 response */
export async function readRateLimit(res: Response): Promise<RateLimitInfo> {
  const body = await res.json().catch(() => null);
  return {
    message:
      typeof body?.message === 'string' && body.message
        ? body.message
        : RATE_LIMITED_FALLBACK_MESSAGE,
    retryAfterSeconds: parseRetryAfter(body, res.headers.get('Retry-After'))
  };
}

/** For the route handlers that proxy the backend: same body and header */
export function rateLimitedJson({ message, retryAfterSeconds }: RateLimitInfo) {
  return {
    body: {
      code: RATE_LIMITED_CODE,
      message,
      retry_after_seconds: retryAfterSeconds
    },
    init: {
      status: 429,
      headers:
        retryAfterSeconds === null
          ? undefined
          : { 'Retry-After': String(retryAfterSeconds) }
    }
  };
}

/** "in 45 seconds", "in about 3 minutes", or "in a moment" */
export function formatRetryAfter(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return 'in a moment';
  if (seconds < 60) return `in ${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `in about ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

// Middleware rewrites a page navigation here when the session can't be
// refreshed because of a 429. The URL stays the page the admin asked for, so
// reloading retries it.
export const TOO_MANY_REQUESTS_PATH = '/too-many-requests';
