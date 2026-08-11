import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, initialized } = useAuthStore();
  if (!initialized) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!isAuthenticated || !['admin','moderator'].includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}
