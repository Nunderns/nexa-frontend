import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { request, SESSION_EXPIRED_EVENT } from './api-client';
import {
  clearSession,
  getSessionUser,
  isAuthenticated as hasSession,
  storeSession,
  type SessionUser,
} from './session';
import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/api';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    request<AuthResponse>({ method: 'POST', url: '/auth/login', data: credentials }),

  register: (credentials: RegisterCredentials) =>
    request<AuthResponse>({ method: 'POST', url: '/auth/register', data: credentials }),

  logout: () => request<void>({ method: 'POST', url: '/auth/logout' }),

  refreshToken: (refreshToken: string) =>
    request<AuthResponse>({ method: 'POST', url: '/auth/refresh', data: { refreshToken } }),

  forgotPassword: (email: string) =>
    request<{ message: string }>({ method: 'POST', url: '/auth/forgot-password', data: { email } }),
};

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read once on mount: the tokens are already in localStorage if a previous
  // session exists, so there is no loading flicker on a refresh.
  const [user, setUser] = useState<SessionUser | null>(() =>
    hasSession() ? getSessionUser() : null,
  );

  // The API layer clears localStorage when a token expires for good. Mirror
  // that in React state so ProtectedRoute redirects instead of leaving the
  // user on a page whose data can no longer load.
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const tokens = await authApi.login(credentials);
    storeSession(tokens);
    setUser({ id: tokens.userId, username: tokens.username, email: tokens.email });
  }, []);

  const signUp = useCallback(async (credentials: RegisterCredentials) => {
    const tokens = await authApi.register(credentials);
    storeSession(tokens);
    setUser({ id: tokens.userId, username: tokens.username, email: tokens.email });
  }, []);

  const signOut = useCallback(async () => {
    const current = getSessionUser();
    // Revoke refresh tokens server-side, but never let a failed request keep
    // the user stuck in the app.
    if (current) {
      try {
        await authApi.logout();
      } catch {
        // Ignored on purpose: local session is cleared below regardless.
      }
    }
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signOut,
    }),
    [user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}