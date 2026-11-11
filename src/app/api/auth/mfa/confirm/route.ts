import { NextResponse } from 'next/server';
import {
  invalidAuthServerResponse,
  parseAuthTokens
} from '@/lib/api/backend-errors';
import { setAuthCookies } from '@/lib/auth/cookies';
import { callMfaStep } from '@/lib/auth/mfa-proxy';
import { clearMfaTicket } from '@/lib/auth/mfa-ticket';
import { mfaCodeSchema } from '@/schemas/auth';
import type { RecoveryCodesResult } from '@/types/auth';

/**
 * Setup's first code turns MFA on and signs the admin in. The recovery codes
 * go to the page once and are never logged or stored here.
 */
export async function POST(request: Request) {
  const parsed = mfaCodeSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Enter the 6-digit code from your authenticator app' },
      { status: 400 }
    );
  }

  const result = await callMfaStep('confirm', request, {
    code: parsed.data.code
  });
  if (!result.ok) return result.response;

  const tokens = parseAuthTokens(result.data);
  const codes = result.data.recovery_codes;
  if (
    !tokens ||
    !Array.isArray(codes) ||
    !codes.every((c) => typeof c === 'string')
  ) {
    return invalidAuthServerResponse();
  }

  setAuthCookies(result.cookieStore, tokens);
  clearMfaTicket(result.cookieStore);

  const body: RecoveryCodesResult = { recovery_codes: codes };
  return NextResponse.json(body, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }
  });
}
