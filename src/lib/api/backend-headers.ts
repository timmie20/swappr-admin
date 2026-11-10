import 'server-only';

// Headers for every call this Next.js server makes to the backend. The
// backend only accepts login, refresh and logout when x-bff-secret matches,
// and rate-limits per visitor using x-client-ip. Browser calls never use this.

type HeaderSource = Pick<Headers, 'get'>;

/**
 * The visitor's IP: x-real-ip, else the first x-forwarded-for entry. Vercel
 * overwrites both on every request, so the visitor can't fake them. An
 * incoming x-client-ip is never trusted.
 */
export function getClientIp(source: HeaderSource): string | null {
  const realIp = source.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwardedFor = source.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || null;
}

let warnedMissingSecret = false;

/** The visitor IP as a plain value, for callers that only have the IP */
export function backendHeadersForIp(
  clientIp: string | null
): Record<string, string> {
  const headers: Record<string, string> = {};

  const secret = process.env.BFF_SHARED_SECRET;
  if (secret) {
    headers['x-bff-secret'] = secret;
  } else if (process.env.NODE_ENV === 'production' && !warnedMissingSecret) {
    // The backend only skips the check when it has no secret either (dev)
    warnedMissingSecret = true;
    console.error(
      'BFF_SHARED_SECRET is not set: the backend will refuse login, refresh and logout'
    );
  }

  // Left out when unknown, so the backend falls back to the connecting IP
  if (clientIp) headers['x-client-ip'] = clientIp;

  return headers;
}

/** x-bff-secret and x-client-ip, from the incoming request's headers */
export function backendHeaders(source: HeaderSource): Record<string, string> {
  return backendHeadersForIp(getClientIp(source));
}
