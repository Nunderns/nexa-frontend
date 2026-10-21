import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/env';
import type { ApiEnvelope, AuthResponse } from '@/types/api';
import { clearSession } from './session';

/**
 * The backend registers `TransformInterceptor` globally, so every successful
 * response arrives as `{ data, success, timestamp }`. Paginated handlers add a
 * *second* wrapper because they already return `{ data, total, ... }`, which
 * makes the wire format `data.data`. Unwrapping in one place keeps every
 * caller working with plain domain objects.
 */
function unwrap<T>(envelope: ApiEnvelope<T>): T {
  return envelope.data;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Reads the `message` produced by the backend `HttpExceptionFilter`. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ message?: unknown }>;
  const message = axiosError?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (axiosError?.code === 'ERR_NETWORK') {
    return 'Cannot reach the Nexa API. Check that the backend is running.';
  }
  return fallback;
}

/**
 * Single-flight access-token refresh. Without this, concurrent 401s (the home
 * page loads posts and communities at the same time) each fire their own
 * refresh and all but the first one is rejected, logging the user out.
 */
let refreshPromise: Promise<string | null> | null = null;

/** Endpoints where a 401 describes bad input, not a bad session. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password'];

function isAuthEndpoint(url = ''): boolean {
  return AUTH_ENDPOINTS.some((path) => url.includes(path));
}

/**
 * Reads `exp` from the access token.
 *
 * This matters because the API answers 401 for two very different situations:
 * an expired token, and an account the guard refuses (see `JwtStrategy`:
 * unverified email, deactivated account). Only the first one means the
 * session is dead. Destroying the session on the second would throw a brand
 * new user back to the login screen the moment they try to vote.
 */
function isAccessTokenExpired(): boolean {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return true;
  }

  const segment = token.split('.')[1];
  if (!segment) {
    return true;
  }

  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    // Decode as UTF-8 rather than via `escape`, which is deprecated and would
    // mangle non-ASCII characters such as a username.
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { exp?: number };
    if (typeof payload.exp !== 'number') {
      return true;
    }
    return payload.exp * 1000 <= Date.now();
  } catch {
    // Unreadable token: treat it as expired rather than trusting it.
    return true;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    return null;
  }

  // Plain axios on purpose: going through `api` would re-enter this interceptor.
  try {
    const { data } = await axios.post<ApiEnvelope<AuthResponse>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    const tokens = unwrap(data);
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    return null;
  }
}

/**
 * Refreshes the access token through the same single flight as the 401
 * interceptor. Used by the notifications socket, whose handshake fails with
 * `Unauthorized` once the 15-minute token expires. Resolves to `null` when
 * the session cannot be recovered. `force` refreshes even when the token
 * still looks valid locally.
 */
export async function refreshSession({ force = false } = {}): Promise<string | null> {
  if (!force && !isAccessTokenExpired()) {
    return localStorage.getItem('access_token');
  }
  refreshPromise = refreshPromise ?? refreshAccessToken();
  return refreshPromise.finally(() => {
    refreshPromise = null;
  });
}

/** Broadcast so the auth context can drop its in-memory user and let the router redirect. */
export const SESSION_EXPIRED_EVENT = 'nexa:session-expired';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const expired = isAccessTokenExpired();

    // Refresh once on an actually-expired token, instead of dropping the
    // session mid-scroll 15 minutes into a visit.
    if (status === 401 && original && !original._retried && expired && !isAuthEndpoint(original.url)) {
      original._retried = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const token = await refreshPromise.finally(() => {
        refreshPromise = null;
      });

      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api.request(original);
      }
    }

    // Unrecoverable session: drop it and notify. Previously this called
    // `window.location.reload()`, which reloaded into the same guarded route
    // and could loop.
    if (status === 401 && expired && !isAuthEndpoint(original?.url)) {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    // 403 is a permission decision, not an authentication problem, so the
    // session stays untouched and the caller surfaces the reason.
    return Promise.reject(error);
  },
);

/** HTTP status of a failed request, when there is one. */
export function getErrorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}

/** Typed request helper that unwraps the envelope for the caller. */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiEnvelope<T>>(config);
  return unwrap(response.data);
}

export default api;
