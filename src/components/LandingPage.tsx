import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import type { LoginCredentials, RegisterCredentials } from '../types';

type Mode = 'login' | 'register';

interface LocationState {
  from?: string;
}

/**
 * First screen a visitor sees. Stays reachable only while signed out: the
 * `PublicOnlyRoute` guard redirects an authenticated user to `/home`.
 */
export function LandingPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  // Return to whatever protected page sent us here, otherwise go to /home.
  const destination = (location.state as LocationState | null)?.from ?? '/home';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }

    if (isRegister && (!username || !displayName)) {
      setError('Choose a username and a display name.');
      return;
    }

    setIsLoading(true);

    try {
      if (isRegister) {
        // `bio` is required by RegisterDto, so always send a string.
        const credentials: RegisterCredentials = {
          username,
          email,
          password,
          displayName,
          bio: '',
        };
        await signUp(credentials);
      } else {
        const credentials: LoginCredentials = { email, password };
        await signIn(credentials);
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not sign you in. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode((current) => (current === 'login' ? 'register' : 'login'));
    setError(null);
  };

  return (
    <div className="landing-container">
      <main className="landing-card">
        <div className="landing-brand">
          <svg className="landing-logo" width="52" height="52" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="5" />
            <path d="M32 16L32 48M16 32L48 32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <h1 className="landing-title">Nexa</h1>
          <p className="landing-subtitle">
            Communities for the things you care about. Join the conversation.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <>
              <label className="field">
                <span className="field-label">Username</span>
                <input
                  className="field-control"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="letters, numbers and _"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Display name</span>
                <input
                  className="field-control"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="How your name appears"
                  autoComplete="name"
                  required
                />
              </label>
            </>
          )}

          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              className="field-control"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              className="field-control"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegister ? 'Uppercase, lowercase and a number' : 'Your password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
            {isLoading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="link-button" onClick={switchMode}>
            {isRegister ? 'Sign in' : 'Sign up'}
          </button>
        </p>

        <p className="terms-text">
          By continuing you agree to our{' '}
          <a href="#terms" className="terms-link">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#privacy" className="terms-link">
            Privacy Policy
          </a>
          .
        </p>
      </main>
    </div>
  );
}