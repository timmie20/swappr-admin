import { NextResponse } from 'next/server';
import { invalidAuthServerResponse } from '@/lib/api/backend-errors';
import { callMfaStep } from '@/lib/auth/mfa-proxy';
import type { MfaSetupResult } from '@/types/auth';

/** A new authenticator secret and its QR code. Calling again replaces it. */
export async function POST(request: Request) {
  const result = await callMfaStep('setup', request);
  if (!result.ok) return result.response;

  const { otpauth_url, qr_data_url, secret } = result.data;
  if (
    typeof otpauth_url !== 'string' ||
    typeof qr_data_url !== 'string' ||
    !qr_data_url.startsWith('data:image/png;base64,') ||
    typeof secret !== 'string'
  ) {
    return invalidAuthServerResponse();
  }

  const body: MfaSetupResult = { otpauth_url, qr_data_url, secret };
  return NextResponse.json(body, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }
  });
}
