import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import {
  attemptsLeftText,
  classifyMfaError,
  groupSecret,
  recoveryCodesText
} from './mfa-errors';

function axiosError(status: number, data: unknown) {
  const headers = new AxiosHeaders();
  return new AxiosError('fail', String(status), { headers }, null, {
    status,
    statusText: '',
    headers: {},
    config: { headers },
    data
  });
}

describe('classifyMfaError', () => {
  it.each([
    [401, 'MFA_TICKET_INVALID'],
    [429, 'MFA_LOCKED']
  ])('%i %s restarts', (status, code) => {
    expect(
      classifyMfaError(axiosError(status, { code, message: 'm' }))
    ).toEqual({ kind: 'restart', message: 'm' });
  });

  it('a wrong code carries attempts_left', () => {
    expect(
      classifyMfaError(
        axiosError(401, {
          code: 'MFA_CODE_INVALID',
          message: 'm',
          attempts_left: 2
        })
      )
    ).toEqual({ kind: 'code_invalid', message: 'm', attemptsLeft: 2 });
  });

  it('the per-visitor 429 carries the wait', () => {
    expect(
      classifyMfaError(
        axiosError(429, {
          code: 'RATE_LIMITED',
          message: 'm',
          retry_after_seconds: 60
        })
      )
    ).toEqual({ kind: 'rate_limited', message: 'm', retryAfterSeconds: 60 });
  });

  it('setup not started', () => {
    expect(
      classifyMfaError(
        axiosError(400, { code: 'MFA_SETUP_NOT_STARTED', message: 'm' })
      ).kind
    ).toBe('setup_not_started');
  });
});

describe('helpers', () => {
  it('groups the secret in fours', () => {
    expect(groupSecret('ABCDEFGHIJKLMN')).toBe('ABCD EFGH IJKL MN');
  });

  it('says how many tries are left', () => {
    expect(attemptsLeftText(1)).toMatch(/^1 try left/);
    expect(attemptsLeftText(3)).toMatch(/^3 tries left/);
    expect(attemptsLeftText(null)).toBeNull();
  });

  it('writes every code into the download', () => {
    const codes = ['aaaaa-bbbbb', 'ccccc-ddddd'];
    const text = recoveryCodesText(codes, 'a@swappr.com.ng');
    for (const c of codes) expect(text).toContain(c);
    expect(text).toContain('a@swappr.com.ng');
  });
});
