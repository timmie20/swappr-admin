import 'server-only';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendHeaders } from '@/lib/api/backend-headers';
import {
  backendErrorResponse,
  readBody,
  type BackendBody
} from '@/lib/api/backend-errors';
import { clearMfaTicket, getMfaTicket } from './mfa-ticket';

// These end the ticket: the page goes back to the password step
const TICKET_ENDING_CODES = new Set(['MFA_TICKET_INVALID', 'MFA_LOCKED']);

type CookieStore = Awaited<ReturnType<typeof cookies>>;

type MfaCallResult =
  | { ok: true; data: BackendBody; cookieStore: CookieStore }
  | { ok: false; response: NextResponse };

/**
 * Calls backend /auth/mfa/{step} with the ticket from the cookie, the BFF
 * secret and the visitor IP. On failure, returns the page's response
 * (and clears the ticket when the backend says it's finished).
 */
export async function callMfaStep(
  step: 'setup' | 'confirm' | 'verify',
  request: Request,
  body: Record<string, string> = {}
): Promise<MfaCallResult> {
  const cookieStore = await cookies();
  const ticket = getMfaTicket(cookieStore);

  if (!ticket) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          code: 'MFA_TICKET_INVALID',
          message: 'Your sign-in timed out. Please enter your password again.'
        },
        { status: 401 }
      )
    };
  }

  try {
    const res = await fetch(`${process.env.API_BASE_URL}/auth/mfa/${step}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...backendHeaders(request.headers)
      },
      body: JSON.stringify({ mfa_ticket: ticket, ...body })
    });

    const data = await readBody(res);

    if (!res.ok) {
      if (typeof data.code === 'string' && TICKET_ENDING_CODES.has(data.code)) {
        clearMfaTicket(cookieStore);
      }
      return {
        ok: false,
        response: backendErrorResponse(
          res,
          data,
          'That didn’t work. Please try again.'
        )
      };
    }

    return { ok: true, data, cookieStore };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: 'An error occurred during sign-in' },
        { status: 500 }
      )
    };
  }
}
