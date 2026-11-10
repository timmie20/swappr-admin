import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken
} from '@/lib/auth/cookies';
import { backendHeaders } from '@/lib/api/backend-headers';

export async function POST() {
  const cookieStore = await cookies();
  const token = getAccessToken(cookieStore);
  const refreshToken = getRefreshToken(cookieStore);

  try {
    await fetch(`${process.env.API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...backendHeaders(await headers())
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  } catch (error) {
    console.error('Error occurred while logging out:', error);
  } finally {
    clearAuthCookies(cookieStore);
  }

  return NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );
}
