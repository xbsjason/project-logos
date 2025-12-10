import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { BiblePage } from './pages/BiblePage';
import { CreatePostPage } from './pages/create/CreatePostPage';
import { PrayerPage } from './pages/prayer/PrayerPage';
import { ExplorePage } from './pages/explore/ExplorePage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { WelcomePage } from './pages/auth/WelcomePage';
import { useAuth } from './contexts/AuthContext';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-cream-100 text-navy">Loading...</div>;

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/prayer" element={<PrayerPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/bible" element={<BiblePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
