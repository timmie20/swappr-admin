import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SECRET = 'b'.repeat(64);

function jsonResponse(status: number, body: unknown, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

describe('attemptRefresh', () => {
  let attemptRefresh: typeof import('./refresh').attemptRefresh;
  const fetchMock = vi.fn();

  beforeEach(async () => {
    vi.stubEnv('API_BASE_URL', 'https://api.test');
    vi.stubEnv('BFF_SHARED_SECRET', SECRET);
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    // Fresh module each test so the in-flight map starts empty
    vi.resetModules();
    ({ attemptRefresh } = await import('./refresh'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('sends the secret and the visitor IP', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        access_token: 'a',
        refresh_token: 'r2',
        expires_at: '2030-01-01T00:00:00Z'
      })
    );

    const result = await attemptRefresh('r1', '1.1.1.1');

    expect(result.status).toBe('ok');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/auth/refresh');
    expect(init.headers).toMatchObject({
      'x-bff-secret': SECRET,
      'x-client-ip': '1.1.1.1'
    });
  });

  it('treats a 429 as rate limited, not a dead session', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        429,
        { code: 'RATE_LIMITED', message: 'Wait', retry_after_seconds: 120 },
        { 'Retry-After': '120' }
      )
    );

    expect(await attemptRefresh('r1', null)).toEqual({
      status: 'rate_limited',
      message: 'Wait',
      retryAfterSeconds: 120
    });
  });

  it('does not cache a rate-limited result', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(429, { message: 'Wait' }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: 'a',
          refresh_token: 'r2',
          expires_at: '2030-01-01T00:00:00Z'
        })
      );

    expect((await attemptRefresh('r1', null)).status).toBe('rate_limited');
    expect((await attemptRefresh('r1', null)).status).toBe('ok');
  });

  it('treats a 401 as failed', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'nope' }));
    expect(await attemptRefresh('r1', null)).toEqual({ status: 'failed' });
  });
});
