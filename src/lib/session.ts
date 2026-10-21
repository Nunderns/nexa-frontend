/**
 * Auth state lives in localStorage so a page refresh keeps the session.
 * The backend access token is short-lived (15m) and a refresh token lives
 * alongside it, so a session is "present" as long as either token exists.
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export function storeSession(tokens: {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
}): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(tokens));
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export interface SessionUser {
  id: number;
  username: string;
  email: string;
}

/** The stored shape is the auth response itself, so `id` is really `userId`. */
export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      userId?: number;
      id?: number;
      username?: string;
      email?: string;
    };
    const id = parsed.userId ?? parsed.id;
    if (typeof id !== 'number' || !parsed.username) {
      return null;
    }
    return { id, username: parsed.username, email: parsed.email ?? '' };
  } catch {
    // Corrupted entry: drop it rather than crashing on every render.
    clearSession();
    return null;
  }
}

/** Used by the route guards: no token means the visitor must sign in. */
export function isAuthenticated(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}