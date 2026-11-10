import { describe, expect, it } from 'vitest';
import {
  formatRetryAfter,
  parseRetryAfter,
  rateLimitedJson
} from './rate-limit';

describe('parseRetryAfter', () => {
  it('prefers retry_after_seconds from the body', () => {
    expect(parseRetryAfter({ retry_after_seconds: 42.2 }, '10')).toBe(43);
  });

  it('falls back to a delta-seconds Retry-After header', () => {
    expect(parseRetryAfter({}, '30')).toBe(30);
  });

  it('reads an HTTP-date Retry-After header', () => {
    const date = new Date(Date.now() + 90_000).toUTCString();
    const seconds = parseRetryAfter(null, date)!;
    expect(seconds).toBeGreaterThan(85);
    expect(seconds).toBeLessThanOrEqual(90);
  });

  it('returns null when nothing is usable', () => {
    expect(parseRetryAfter(null, null)).toBeNull();
    expect(parseRetryAfter({}, 'soon')).toBeNull();
  });
});

describe('rateLimitedJson', () => {
  it('builds a 429 with the backend body and Retry-After', () => {
    const { body, init } = rateLimitedJson({
      message: 'Slow down',
      retryAfterSeconds: 60
    });
    expect(body).toEqual({
      code: 'RATE_LIMITED',
      message: 'Slow down',
      retry_after_seconds: 60
    });
    expect(init).toEqual({ status: 429, headers: { 'Retry-After': '60' } });
  });
});

describe('formatRetryAfter', () => {
  it('formats seconds and minutes', () => {
    expect(formatRetryAfter(null)).toBe('in a moment');
    expect(formatRetryAfter(1)).toBe('in 1 second');
    expect(formatRetryAfter(45)).toBe('in 45 seconds');
    expect(formatRetryAfter(130)).toBe('in about 3 minutes');
  });
});
