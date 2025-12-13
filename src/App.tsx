import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { BiblePage } from './pages/BiblePage';
import { UnifiedCreatePostScreen } from './pages/create/UnifiedCreatePostScreen';
import { PostDetailPage } from './pages/feed/PostDetailPage';
import { TagFeedPage } from './pages/feed/TagFeedPage';
// import { CreatePostPage } from './pages/create/CreatePostPage'; // Deprecated
import { PrayerPage } from './pages/prayer/PrayerPage';
import { ExplorePage } from './pages/explore/ExplorePage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { WelcomePage } from './pages/auth/WelcomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { useAuth } from './contexts/AuthContext';

import { UserListPage } from './pages/profile/UserListPage';
import { ThemeDebugPage } from './pages/debug/ThemeDebugPage';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen flex items-center justify-center bg-cream-100 text-navy">Loading...</div>;

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  // Enforce username (skip for anonymous users)
  if (!user.username && !user.isAnonymous && location.pathname !== '/profile/edit') {
    return <Navigate to="/profile/edit" replace />;
  }

  return (
    <AppShell />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/prayer" element={<PrayerPage />} />
          <Route path="/create" element={<UnifiedCreatePostScreen />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/bible" element={<BiblePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/profile/:userId/followers" element={<UserListPage type="followers" />} />
          <Route path="/profile/:userId/following" element={<UserListPage type="following" />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/post/:postId" element={<PostDetailPage />} />
          <Route path="/tags/:tag" element={<TagFeedPage />} />
          <Route path="/debug/theme" element={<ThemeDebugPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
