import { getApiError } from '@/lib/api/errors';

/** What a sign-in step does with a failed call to /api/auth/mfa/* */
export type MfaErrorAction =
  /** Ticket expired, used up or the account is locked: back to the password */
  | { kind: 'restart'; message: string }
  /** Per-visitor limit: show the message and wait */
  | { kind: 'rate_limited'; message: string; retryAfterSeconds: number | null }
  /** Wrong or already-used code: stay, clear the input */
  | { kind: 'code_invalid'; message: string; attemptsLeft: number | null }
  /** Confirm before setup: run setup again */
  | { kind: 'setup_not_started'; message: string }
  | { kind: 'other'; message: string };

export function classifyMfaError(error: unknown): MfaErrorAction {
  const { status, code, message, extra } = getApiError(
    error,
    'Something went wrong. Please try again.'
  );

  if (code === 'MFA_TICKET_INVALID' || code === 'MFA_LOCKED') {
    return { kind: 'restart', message };
  }
  if (status === 429) {
    const seconds = extra.retry_after_seconds;
    return {
      kind: 'rate_limited',
      message,
      retryAfterSeconds: typeof seconds === 'number' ? seconds : null
    };
  }
  if (code === 'MFA_CODE_INVALID') {
    const left = extra.attempts_left;
    return {
      kind: 'code_invalid',
      message,
      attemptsLeft: typeof left === 'number' ? left : null
    };
  }
  if (code === 'MFA_SETUP_NOT_STARTED') {
    return { kind: 'setup_not_started', message };
  }
  return { kind: 'other', message };
}

/** "3 tries left before you have to sign in again." */
export function attemptsLeftText(attemptsLeft: number | null): string | null {
  if (attemptsLeft === null) return null;
  if (attemptsLeft <= 0) return null;
  return `${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} left before you have to sign in again.`;
}

/** The secret in groups of 4, for typing in by hand */
export function groupSecret(secret: string): string {
  return (
    secret
      .replace(/\s+/g, '')
      .match(/.{1,4}/g)
      ?.join(' ') ?? secret
  );
}

/** The .txt download for a set of recovery codes */
export function recoveryCodesText(
  codes: string[],
  account?: string,
  date = new Date()
): string {
  return [
    'Swappr admin: two-step sign-in recovery codes',
    ...(account ? [`Account: ${account}`] : []),
    `Made: ${date.toISOString().slice(0, 10)}`,
    '',
    'Each code works once, if you lose access to your authenticator app.',
    'Making new codes replaces all of these.',
    '',
    ...codes,
    ''
  ].join('\n');
}
