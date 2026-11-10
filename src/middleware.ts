import { NextRequest, NextResponse } from 'next/server';
import {
  clearAuthCookies,
  COOKIE_NAMES,
  setAuthCookies
} from './lib/auth/cookies';
import { attemptRefresh } from './lib/auth/refresh';
import { getClientIp } from './lib/api/backend-headers';
import { TOO_MANY_REQUESTS_PATH } from './lib/api/rate-limit';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/auth/sign-in', TOO_MANY_REQUESTS_PATH];

// Routes that authenticated admins shouldn't access (redirect to dashboard)
const AUTH_ROUTES = ['/auth/sign-in'];

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

function getTokensFromRequest(request: NextRequest) {
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
  const expiresAtRaw = request.cookies.get(COOKIE_NAMES.EXPIRES_AT)?.value;
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : null;

  return { accessToken, refreshToken, expiresAt };
}

function isExpired(expiresAt: number | null, bufferMs = 60_000): boolean {
  if (!expiresAt || isNaN(expiresAt)) return true;
  return Date.now() >= expiresAt - bufferMs;
}

export async function handleTokenRefresh(
  refreshToken: string,
  request: NextRequest
): Promise<NextResponse> {
  const result = await attemptRefresh(
    refreshToken,
    getClientIp(request.headers)
  );

  // A 429 is temporary and the refresh token wasn't redeemed, so keep the
  // cookies. If the access token still works (we refresh a minute early),
  // let the page load; otherwise show the wait page instead of signing out.
  if (result.status === 'rate_limited') {
    const { accessToken, expiresAt } = getTokensFromRequest(request);
    if (accessToken && !isExpired(expiresAt, 0)) {
      return NextResponse.next();
    }
    const url = new URL(TOO_MANY_REQUESTS_PATH, request.url);
    if (result.retryAfterSeconds !== null) {
      url.searchParams.set('retry_after', String(result.retryAfterSeconds));
    }
    return NextResponse.rewrite(url);
  }

  if (result.status === 'failed') {
    const response = NextResponse.redirect(
      new URL('/auth/sign-in', request.url)
    );
    clearAuthCookies(response.cookies);
    return response;
  }

  const response = NextResponse.next();
  setAuthCookies(response.cookies, result.tokens);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { accessToken, refreshToken, expiresAt } =
    getTokensFromRequest(request);

  const hasSession = !!accessToken;
  const sessionExpired = isExpired(expiresAt);

  // ── 1. Authenticated admin hitting the sign-in page ─────────────────────
  if (hasSession && !sessionExpired && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard/overview', request.url));
  }

  // ── 2. Public route — let it through unconditionally ────────────────────
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ── 3. No access token cookie ────────────────────────────────────────────
  if (!hasSession) {
    if (!refreshToken) {
      const loginUrl = new URL('/auth/sign-in', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return handleTokenRefresh(refreshToken, request);
  }

  // ── 4. Session exists but token is expired — attempt silent refresh ─────
  if (sessionExpired) {
    if (!refreshToken) {
      const response = NextResponse.redirect(
        new URL('/auth/sign-in', request.url)
      );
      clearAuthCookies(response.cookies);
      return response;
    }
    return handleTokenRefresh(refreshToken, request);
  }

  // ── 5. Valid session — proceed ────────────────────────────────────────────
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, and the auth API routes (which
    // must never be gated by this same logic, or login/refresh would loop)
    '/((?!_next|api/auth|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'
  ]
};
