import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

import Layout from './components/Layout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Lesson from './pages/Lesson';
import AIChat from './pages/AIChat';
import Pronunciation from './pages/Pronunciation';
import Social from './pages/Social';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Subscription from './pages/Subscription';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600">404</h1>
        <p className="mt-4 text-xl font-semibold text-gray-800">
          Page not found
        </p>
        <p className="mt-2 text-gray-600">
          The page you are looking for does not exist.
        </p>

        <a
          href="/"
          className="inline-block mt-6 btn-primary px-6 py-3"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

function App() {
  const initialized = useAuthStore((state) => state.initialized);
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await init();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      }
    };

    if (mounted) {
      initialize();
    }

    return () => {
      mounted = false;
    };
  }, [init]);

  // Wait until authentication initialization is complete
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">
            Loading LingoVerse...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>

        {/* Public */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Protected */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="learn"
          element={
            <ProtectedRoute>
              <Learn />
            </ProtectedRoute>
          }
        />

        <Route
          path="learn/:courseId"
          element={
            <ProtectedRoute>
              <Learn />
            </ProtectedRoute>
          }
        />

        <Route
          path="lesson/:lessonId"
          element={
            <ProtectedRoute>
              <Lesson />
            </ProtectedRoute>
          }
        />

        <Route
          path="ai-tutor"
          element={
            <ProtectedRoute>
              <AIChat />
            </ProtectedRoute>
          }
        />

        <Route
          path="pronunciation"
          element={
            <ProtectedRoute>
              <Pronunciation />
            </ProtectedRoute>
          }
        />

        <Route
          path="social"
          element={
            <ProtectedRoute>
              <Social />
            </ProtectedRoute>
          }
        />

        <Route
          path="friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />

        <Route
          path="profile/:userId?"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="achievements"
          element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          }
        />

        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="subscription"
          element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          }
        />

        {/* Admin / Moderator */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Route>
    </Routes>
  );
}

export default App;