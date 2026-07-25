import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
};

// Middleware only refreshes on page navigations — a client-rendered page
// left open past access-token expiry (or resumed after the tab was asleep)
// gets a 401 on its next query with nothing to recover it, until the admin
// happens to navigate somewhere. This calls the same rotating-refresh route
// middleware uses, then retries once. Single-flighted here too so concurrent
// queries share one refresh call instead of each racing their own against
// the one-time-use refresh token.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', null, { withCredentials: true })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried
    ) {
      originalRequest._retried = true;

      const refreshed = await refreshSession();
      if (refreshed) {
        return apiClient(originalRequest);
      }

      if (typeof window !== 'undefined') {
        window.location.replace('/auth/sign-in');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
