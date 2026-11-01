import { isAxiosError } from 'axios';

/**
 * The backend's error body: `{ statusCode, error, code, message, ...extra }`.
 * Validation failures are Nest's usual 400 with `message: string[]` and no
 * `code`. Switch on `code`, never on `message`.
 */
export interface ApiErrorInfo {
  status: number | null;
  code: string | null;
  message: string;
  extra: Record<string, unknown>;
}

export function getApiError(
  error: unknown,
  fallback = 'Something went wrong'
): ApiErrorInfo {
  if (!isAxiosError(error)) {
    return { status: null, code: null, message: fallback, extra: {} };
  }

  const status = error.response?.status ?? null;
  const body = (error.response?.data ?? {}) as Record<string, unknown>;
  const { code, message, ...extra } = body;
  delete extra.statusCode;
  delete extra.error;

  let text = fallback;
  if (Array.isArray(message)) text = message.join('. ');
  else if (typeof message === 'string' && message) text = message;
  else if (status === 403) text = 'Superadmin access required';

  return {
    status,
    code: typeof code === 'string' ? code : null,
    message: text,
    extra
  };
}

export function isForbidden(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 403;
}

// React Query `retry` option: a 4xx (403, 404, 409…) will not change on a
// second attempt, so only retry network errors and 5xx once
export function retryUnlessClientError(
  failureCount: number,
  error: unknown
): boolean {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status && status >= 400 && status < 500) return false;
  }
  return failureCount < 1;
}
