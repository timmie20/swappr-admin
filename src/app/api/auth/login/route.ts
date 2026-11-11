import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signInSchema } from '@/schemas/auth';
import { setAuthCookies } from '@/lib/auth/cookies';
import { clearMfaTicket, setMfaTicket } from '@/lib/auth/mfa-ticket';
import { backendHeaders } from '@/lib/api/backend-headers';
import {
  backendErrorResponse,
  invalidAuthServerResponse,
  parseAuthTokens,
  readBody
} from '@/lib/api/backend-errors';
import type { SignInStep } from '@/types/auth';

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

    const data = await readBody(res);

    if (!res.ok) {
      return backendErrorResponse(res, data, 'Invalid email or password');
    }

    const cookieStore = await cookies();

    // Two-step sign-in: the password was right, and the session comes from
    // /api/auth/mfa/* once the code checks out. The ticket stays server-side.
    if (data.mfa_required === true || data.mfa_setup_required === true) {
      if (typeof data.mfa_ticket !== 'string' || !data.mfa_ticket) {
        return invalidAuthServerResponse();
      }
      setMfaTicket(cookieStore, data.mfa_ticket, data.expires_at);
      const step: SignInStep = data.mfa_required ? 'verify' : 'setup';
      return NextResponse.json({ step }, { status: 200 });
    }

    // A backend without MFA still returns the session here. Remove this
    // branch once the MFA backend is live everywhere.
    const tokens = parseAuthTokens(data);
    if (!tokens) return invalidAuthServerResponse();

    setAuthCookies(cookieStore, tokens);
    clearMfaTicket(cookieStore);

    const step: SignInStep = 'done';
    return NextResponse.json(
      { step, message: 'Login successful' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
