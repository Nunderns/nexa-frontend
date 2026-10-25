import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from '@/lib/auth-guards';
import { ChatPage } from './routes/ChatPage';
import { CommunityModPage } from './routes/CommunityModPage';
import { CommunityPage } from './routes/CommunityPage';
import { CreatePage } from './routes/CreatePage';
import { DraftsPage } from './routes/DraftsPage';
import { HomePage } from './routes/HomePage';
import { LoginPage } from './routes/LoginPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { NotificationsPage } from './routes/NotificationsPage';
import { PopularPage } from './routes/PopularPage';
import { PostDetailPage } from './routes/PostDetailPage';
import { ProfilePage } from './routes/profile/ProfilePage';
import { SearchPage } from './routes/SearchPage';
import { SettingsPage } from './routes/SettingsPage';

/**
 * `/` is an alias for the landing page so a fresh visit lands on the login
 * screen. `PublicOnlyRoute` bounces anyone with a session to `/home`.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/popular/:sort?" element={<PopularPage />} />
        <Route path="/posts/:postId" element={<PostDetailPage />} />
        <Route path="/c/:name" element={<CommunityPage />} />
        <Route path="/c/:name/mod" element={<CommunityModPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/drafts" element={<DraftsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}