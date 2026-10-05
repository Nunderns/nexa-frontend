import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi, SESSION_EXPIRED_EVENT } from '../services/api';
import {
  clearSession,
  getSessionUser,
  isAuthenticated as hasSession,
  storeSession,
  type SessionUser,
} from '../services/session';
import type { LoginCredentials, RegisterCredentials } from '../types';

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
        await authApi.logout(current.id);
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