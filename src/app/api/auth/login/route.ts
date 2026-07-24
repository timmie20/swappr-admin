import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signInSchema } from '@/schemas/auth';
import { setAuthCookies } from '@/lib/auth/cookies';
import { AuthTokens } from '@/types/auth';

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${process.env.API_BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || 'Invalid email or password' },
        { status: res.status }
      );
    }

    const tokens: AuthTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(data.expires_at).getTime()
    };

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expires_at) {
      return NextResponse.json(
        { message: 'Invalid response from auth server' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    setAuthCookies(cookieStore, tokens);

    return NextResponse.json({ message: 'Login successful' }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
