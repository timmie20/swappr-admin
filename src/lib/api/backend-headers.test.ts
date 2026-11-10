import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backendHeaders, getClientIp } from './backend-headers';

const SECRET = 'a'.repeat(64);

describe('getClientIp', () => {
  it('uses x-real-ip first', () => {
    const h = new Headers({
      'x-real-ip': '1.1.1.1',
      'x-forwarded-for': '2.2.2.2, 3.3.3.3'
    });
    expect(getClientIp(h)).toBe('1.1.1.1');
  });

  it('falls back to the first x-forwarded-for entry, trimmed', () => {
    const h = new Headers({ 'x-forwarded-for': '  2.2.2.2 , 3.3.3.3' });
    expect(getClientIp(h)).toBe('2.2.2.2');
  });

  it('returns null when neither header is present', () => {
    expect(getClientIp(new Headers())).toBeNull();
  });

  it('never reads an incoming x-client-ip', () => {
    expect(getClientIp(new Headers({ 'x-client-ip': '6.6.6.6' }))).toBeNull();
  });
});

describe('backendHeaders', () => {
  beforeEach(() => vi.stubEnv('BFF_SHARED_SECRET', SECRET));
  afterEach(() => vi.unstubAllEnvs());

  it('always sets the secret', () => {
    expect(backendHeaders(new Headers())['x-bff-secret']).toBe(SECRET);
    expect(
      backendHeaders(new Headers({ 'x-real-ip': '1.1.1.1' }))['x-bff-secret']
    ).toBe(SECRET);
  });

  it('sends the visitor IP, not an incoming x-client-ip', () => {
    const h = new Headers({
      'x-client-ip': '6.6.6.6',
      'x-real-ip': '1.1.1.1'
    });
    expect(backendHeaders(h)['x-client-ip']).toBe('1.1.1.1');
  });

  it('leaves x-client-ip out when no IP is found', () => {
    const h = new Headers({ 'x-client-ip': '6.6.6.6' });
    expect(backendHeaders(h)).toEqual({ 'x-bff-secret': SECRET });
  });

  it('sends no secret header when none is configured', () => {
    vi.stubEnv('BFF_SHARED_SECRET', '');
    expect(backendHeaders(new Headers())).not.toHaveProperty('x-bff-secret');
  });
});
