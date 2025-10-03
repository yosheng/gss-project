'use client';

import { useEffect, useState, useCallback } from 'react';
import Login from '@/components/login';
import AppRouter from '@/components/router/app-router';
import { useAuth } from '@/components/auth-provider';
import { signOut, validateUserSession } from '@/lib/auth';

export default function Page() {
  const { user, loading, error } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // 檢查認證狀態
  useEffect(() => {
    if (!loading) {
      const authenticated = validateUserSession(user);
      setIsAuthenticated(authenticated);
      setShowLogin(!authenticated);
      
      // 如果有認證錯誤，記錄到控制台
      if (error) {
        console.error('Authentication error:', error);
      }
    }
  }, [user, loading, error]);

  // 處理登出
  const handleLogout = useCallback(async () => {
    try {
      console.log('Initiating logout...');
      await signOut();
      setIsAuthenticated(false);
      setShowLogin(true);
    } catch (error) {
      console.error('Logout error:', error);
      // 即使登出失敗，也要重置狀態以確保安全
      setIsAuthenticated(false);
      setShowLogin(true);
    }
  }, []);

  // 處理登入成功
  const handleLoginSuccess = useCallback(() => {
    console.log('Login successful, updating state...');
    setIsAuthenticated(true);
    setShowLogin(false);
  }, []);

  // 處理重定向到登入頁面（由路由守衛觸發）
  const handleRedirectToLogin = useCallback(() => {
    console.log('Redirecting to login page...');
    setIsAuthenticated(false);
    setShowLogin(true);
  }, []);

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

  // 如果需要顯示登入頁面或用戶未認證，顯示登入頁面
  if (showLogin || !isAuthenticated) {
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