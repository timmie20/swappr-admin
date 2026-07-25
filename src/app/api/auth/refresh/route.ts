import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  clearAuthCookies,
  COOKIE_NAMES,
  setAuthCookies
} from '@/lib/auth/cookies';
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

  const tokens = await attemptRefresh(refreshToken);

  if (!tokens) {
    clearAuthCookies(cookieStore);
    return NextResponse.json(
      { message: 'Session expired — please sign in again' },
      { status: 401 }
    );
  }

  setAuthCookies(cookieStore, tokens);
  return NextResponse.json({ message: 'Token refreshed' }, { status: 200 });
}
