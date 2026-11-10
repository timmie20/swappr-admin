import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import {
  clearAuthCookies,
  COOKIE_NAMES,
  setAuthCookies
} from '@/lib/auth/cookies';
import { getClientIp } from '@/lib/api/backend-headers';
import { rateLimitedJson } from '@/lib/api/rate-limit';
import { attemptRefresh } from '@/lib/auth/refresh';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { message: 'No refresh token found' },
      { status: 401 }
    );
  }

  const result = await attemptRefresh(
    refreshToken,
    getClientIp(await headers())
  );

  // Temporary: the token wasn't redeemed, so keep every cookie. Callers show
  // the message and don't retry.
  if (result.status === 'rate_limited') {
    const { body, init } = rateLimitedJson(result);
    return NextResponse.json(body, init);
  }

  if (result.status === 'failed') {
    clearAuthCookies(cookieStore);
    return NextResponse.json(
      { message: 'Session expired — please sign in again' },
      { status: 401 }
    );
  }

  setAuthCookies(cookieStore, result.tokens);
  return NextResponse.json({ message: 'Token refreshed' }, { status: 200 });
}
