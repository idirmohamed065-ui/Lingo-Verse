import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { user, isAuthenticated, login, register, logout, updateUser } = useAuthStore();
  return { user, isAuthenticated, login, register, logout, updateUser };
}
