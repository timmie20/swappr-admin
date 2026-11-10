import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signInSchema } from '@/schemas/auth';
import { setAuthCookies } from '@/lib/auth/cookies';
import { backendHeaders } from '@/lib/api/backend-headers';
import { rateLimitedJson, readRateLimit } from '@/lib/api/rate-limit';
import { AuthTokens } from '@/types/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

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
      headers: {
        'Content-Type': 'application/json',
        ...backendHeaders(request.headers)
      },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        // The backend verifies it; we only pass it through
        ...(parsed.data.turnstile_token
          ? { turnstile_token: parsed.data.turnstile_token }
          : {})
      })
    });

    if (res.status === 429) {
      const { body, init } = rateLimitedJson(await readRateLimit(res));
      return NextResponse.json(body, init);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // A missing or mismatched BFF_SHARED_SECRET, not a bad password
      if (data.code === 'BFF_ONLY') {
        console.error(
          'Backend refused admin login with BFF_ONLY: check BFF_SHARED_SECRET'
        );
        return NextResponse.json(
          {
            code: 'BFF_ONLY',
            message: 'Sign-in is unavailable right now. Please try again later.'
          },
          { status: 503 }
        );
      }

      const message = Array.isArray(data.message)
        ? data.message.join('. ')
        : data.message;
      return NextResponse.json(
        {
          ...(typeof data.code === 'string' ? { code: data.code } : {}),
          message: message || 'Invalid email or password'
        },
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
