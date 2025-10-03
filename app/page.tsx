'use client';

import { useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import Login from '@/components/login';
import AppRouter from '@/components/router/app-router';
import { useAuth } from '@/components/auth-provider';
import { signOut } from '@/lib/auth';

export default function Page() {
  const { user, loading, error, setAuth } = useAuth();

  // 處理登出
  const handleLogout = useCallback(async () => {
    try {
      console.log('Initiating logout...');
      await signOut();
      // For local auth, we need to manually clear the user state
      if (user?.id === 'admin-user-id') {
        setAuth(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear user state for security
      setAuth(null);
    }
  }, [setAuth, user]);

  // 處理登入成功
  const handleLoginSuccess = useCallback((newUser: User) => {
    console.log('Login successful, updating auth context...');
    setAuth(newUser);
  }, [setAuth]);

  // 處理重定向到登入頁面（由路由守衛觸發）
  const handleRedirectToLogin = useCallback(() => {
    console.log('Redirecting to login page...');
    setAuth(null);
  }, [setAuth]);

  // 顯示載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">正在初始化系統...</p>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // 如果用戶未認證，顯示登入頁面
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 用戶已認證，顯示應用路由器
  return (
    <AppRouter 
      user={user} 
      onLogout={handleLogout}
      onRedirectToLogin={handleRedirectToLogin}
    />
  );
}