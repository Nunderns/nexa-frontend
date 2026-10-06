import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicOnlyRoute, ProtectedRoute } from './guards';
import { LandingPage } from '../components/LandingPage';
import { HomePage } from '../pages/HomePage';
import { ProfilePage } from '../pages/ProfilePage';
import { NotFoundPage } from '../pages/NotFoundPage';

/**
 * `/` is an alias for the landing page so a fresh visit lands on the login
 * screen. `PublicOnlyRoute` bounces anyone with a session to `/home`.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LandingPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}