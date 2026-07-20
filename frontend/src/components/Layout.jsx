import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';

export default function Layout() {
  const { init } = useAuthStore();
  useEffect(() => { init(); }, [init]);
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16"><Outlet /></main>
    </div>
  );
}
