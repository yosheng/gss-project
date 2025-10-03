'use client';

import { useEffect, useState } from 'react';
import Login from '@/components/login';
import AppRouter from '@/components/router/app-router';
import { useAuth } from '@/components/auth-provider';
import { signOut } from '@/lib/auth';

export default function Page() {
  const { user, loading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    setIsAuthenticated(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">正在初始化系統...</p>
        </div>
      </div>
    );
  }

  // 如果用戶未認證，顯示登入頁面
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 用戶已認證，顯示應用路由器
  return <AppRouter user={user} onLogout={handleLogout} />;
}