import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A cookie jar standing in for next/headers cookies()
type Jar = Map<string, { value: string; options: Record<string, unknown> }>;
const jar: Jar = new Map();
const cookieStore = {
  get: (name: string) => {
    const c = jar.get(name);
    return c && c.value ? { name, value: c.value } : undefined;
  },
  set: (name: string, value: string, options: Record<string, unknown> = {}) => {
    jar.set(name, { value, options });
  }
};

vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers()
}));

const SECRET = 'c'.repeat(64);
const fetchMock = vi.fn();

function backend(status: number, body: unknown, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

function post(body?: unknown) {
  return new Request('http://admin.test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': '1.2.3.4' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

const SESSION = {
  access_token: 'acc',
  refresh_token: 'ref',
  expires_at: '2030-01-01T00:00:00.000Z',
  user: { id: 'u1' }
};

const LOGIN = { email: 'a@swappr.com.ng', password: 'Password1' };

beforeEach(() => {
  jar.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('API_BASE_URL', 'https://api.test');
  vi.stubEnv('BFF_SHARED_SECRET', SECRET);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('POST /api/auth/login', () => {
  it('signs in as today when the backend returns tokens (no MFA yet)', async () => {
    const { POST } = await import('./login/route');
    fetchMock.mockResolvedValue(backend(201, SESSION));

    const res = await POST(post(LOGIN));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ step: 'done' });
    expect(jar.get('swappr_admin_access')?.value).toBe('acc');
    expect(jar.get('swappr_admin_refresh')?.value).toBe('ref');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toMatchObject({
      'x-bff-secret': SECRET,
      'x-client-ip': '1.2.3.4'
    });
  });

  it.each([
    ['mfa_required', 'verify'],
    ['mfa_setup_required', 'setup']
  ])('%s → step %s, ticket in an httpOnly cookie only', async (flag, step) => {
    const { POST } = await import('./login/route');
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
    fetchMock.mockResolvedValue(
      backend(201, { [flag]: true, mfa_ticket: 'T1', expires_at: expiresAt })
    );

    const res = await POST(post(LOGIN));
    const body = await res.json();

    expect(body).toEqual({ step });
    expect(JSON.stringify(body)).not.toContain('T1');
    const ticket = jar.get('swappr_admin_mfa_ticket');
    expect(ticket?.value).toBe('T1');
    expect(ticket?.options).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/auth/mfa'
    });
    expect(ticket?.options).not.toHaveProperty('domain');
    expect(ticket?.options.maxAge).toBeGreaterThan(290);
    expect(ticket?.options.maxAge).toBeLessThanOrEqual(300);
    // No session yet
    expect(jar.has('swappr_admin_access')).toBe(false);
  });

  it('passes a 429 through with the wait time', async () => {
    const { POST } = await import('./login/route');
    fetchMock.mockResolvedValue(
      backend(
        429,
        { code: 'RATE_LIMITED', message: 'Slow down', retry_after_seconds: 90 },
        { 'Retry-After': '90' }
      )
    );

    const res = await POST(post(LOGIN));

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('90');
    expect(await res.json()).toMatchObject({
      code: 'RATE_LIMITED',
      message: 'Slow down',
      retry_after_seconds: 90
    });
  });

  it('turns BFF_ONLY into a 503', async () => {
    const { POST } = await import('./login/route');
    fetchMock.mockResolvedValue(
      backend(401, { code: 'BFF_ONLY', message: 'Sign in through the app.' })
    );
    const res = await POST(post(LOGIN));
    expect(res.status).toBe(503);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('POST /api/auth/mfa/*', () => {
  beforeEach(() => {
    cookieStore.set('swappr_admin_mfa_ticket', 'T1', {
      path: '/api/auth/mfa'
    });
  });

  it('without a ticket, sends the page back to the password step', async () => {
    jar.clear();
    const { POST } = await import('./mfa/verify/route');
    const res = await POST(post({ code: '123456' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'MFA_TICKET_INVALID' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('setup sends the ticket and returns the QR fields', async () => {
    const { POST } = await import('./mfa/setup/route');
    const setup = {
      otpauth_url: 'otpauth://totp/Swappr?secret=ABC',
      qr_data_url: 'data:image/png;base64,AAAA',
      secret: 'ABCDEFGHIJKLMNOP'
    };
    fetchMock.mockResolvedValue(backend(201, setup));

    const res = await POST(post());

    expect(await res.json()).toEqual(setup);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/auth/mfa/setup');
    expect(JSON.parse(init.body)).toEqual({ mfa_ticket: 'T1' });
    expect(init.headers).toMatchObject({ 'x-bff-secret': SECRET });
    // Still mid-setup: the ticket stays
    expect(jar.get('swappr_admin_mfa_ticket')?.value).toBe('T1');
  });

  it('confirm signs in, clears the ticket and returns only the codes', async () => {
    const { POST } = await import('./mfa/confirm/route');
    const codes = Array.from({ length: 10 }, (_, i) => `aaaa${i}-bbbbb`);
    fetchMock.mockResolvedValue(
      backend(201, { ...SESSION, recovery_codes: codes })
    );

    const res = await POST(post({ code: '123 456' }));
    const body = await res.json();

    expect(body).toEqual({ recovery_codes: codes });
    expect(jar.get('swappr_admin_access')?.value).toBe('acc');
    expect(jar.get('swappr_admin_mfa_ticket')?.value).toBe('');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      mfa_ticket: 'T1',
      code: '123 456'
    });
  });

  it('verify with a recovery code sends only recovery_code', async () => {
    const { POST } = await import('./mfa/verify/route');
    fetchMock.mockResolvedValue(backend(201, SESSION));

    const res = await POST(post({ recovery_code: 'abcde-23456' }));

    expect(res.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      mfa_ticket: 'T1',
      recovery_code: 'abcde-23456'
    });
    expect(jar.get('swappr_admin_refresh')?.value).toBe('ref');
    expect(jar.get('swappr_admin_mfa_ticket')?.value).toBe('');
  });

  it('verify refuses both or neither without calling the backend', async () => {
    const { POST } = await import('./mfa/verify/route');
    for (const body of [
      {},
      { code: '123456', recovery_code: 'abcde-23456' },
      { code: '12345' }
    ]) {
      expect((await POST(post(body))).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a wrong code keeps the ticket and passes attempts_left', async () => {
    const { POST } = await import('./mfa/verify/route');
    fetchMock.mockResolvedValue(
      backend(401, {
        code: 'MFA_CODE_INVALID',
        message: 'That code didn’t work.',
        attempts_left: 3
      })
    );

    const res = await POST(post({ code: '000000' }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      code: 'MFA_CODE_INVALID',
      message: 'That code didn’t work.',
      attempts_left: 3
    });
    expect(jar.get('swappr_admin_mfa_ticket')?.value).toBe('T1');
    expect(jar.has('swappr_admin_access')).toBe(false);
  });

  it.each([
    [401, 'MFA_TICKET_INVALID'],
    [429, 'MFA_LOCKED']
  ])('%i %s clears the ticket and passes the code', async (status, code) => {
    const { POST } = await import('./mfa/verify/route');
    fetchMock.mockResolvedValue(backend(status, { code, message: 'Nope' }));

    const res = await POST(post({ code: '000000' }));

    expect(res.status).toBe(status);
    expect(await res.json()).toMatchObject({ code, message: 'Nope' });
    expect(jar.get('swappr_admin_mfa_ticket')?.value).toBe('');
  });

  it('a Redis outage (503) says sign-in is unavailable', async () => {
    const { POST } = await import('./mfa/verify/route');
    fetchMock.mockResolvedValue(
      backend(503, { statusCode: 503, message: 'Sign-in is unavailable.' })
    );
    const res = await POST(post({ code: '123456' }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({
      message: 'Sign-in is unavailable.'
    });
  });
});
