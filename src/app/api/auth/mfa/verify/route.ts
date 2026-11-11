import { NextResponse } from 'next/server';
import {
  invalidAuthServerResponse,
  parseAuthTokens
} from '@/lib/api/backend-errors';
import { setAuthCookies } from '@/lib/auth/cookies';
import { callMfaStep } from '@/lib/auth/mfa-proxy';
import { clearMfaTicket } from '@/lib/auth/mfa-ticket';
import { mfaVerifySchema } from '@/schemas/auth';

/** Sign-in's second step: a code from the app, or a recovery code */
export async function POST(request: Request) {
  const parsed = mfaVerifySchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Enter a 6-digit code or a recovery code' },
      { status: 400 }
    );
  }

  // Exactly one of the two goes to the backend
  const result = await callMfaStep(
    'verify',
    request,
    'code' in parsed.data
      ? { code: parsed.data.code }
      : { recovery_code: parsed.data.recovery_code }
  );
  if (!result.ok) return result.response;

  const tokens = parseAuthTokens(result.data);
  if (!tokens) return invalidAuthServerResponse();

  setAuthCookies(result.cookieStore, tokens);
  clearMfaTicket(result.cookieStore);

  return NextResponse.json({ message: 'Signed in' }, { status: 200 });
}
