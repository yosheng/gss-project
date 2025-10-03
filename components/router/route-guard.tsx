'use client';

import { ReactNode, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { validateUserSession } from '@/lib/auth';

interface RouteGuardProps {
  user: User | null;
  children: ReactNode;
  requireAuth?: boolean;
  onRedirectToLogin?: () => void;
}

export default function RouteGuard({ 
  user, 
  children, 
  requireAuth = true, 
  onRedirectToLogin 
}: RouteGuardProps) {
  const [isValidating, setIsValidating] = useState(false);

  // 如果不需要認證，直接渲染子組件
  if (!requireAuth) {
    return <>{children}</>;
  }

  // 檢查認證狀態並處理重定向
  useEffect(() => {
    if (requireAuth) {
      const isValid = validateUserSession(user);
      
      if (!isValid) {
        setIsValidating(true);
        
        // 延遲執行重定向，給認證系統一些時間來初始化
        const redirectTimer = setTimeout(() => {
          if (onRedirectToLogin) {
            console.log('Route guard: Redirecting to login - user not authenticated');
            onRedirectToLogin();
          }
          setIsValidating(false);
        }, 1000);

        return () => clearTimeout(redirectTimer);
      } else {
        setIsValidating(false);
      }
    }
  }, [requireAuth, user, onRedirectToLogin]);

  // 如果需要認證但用戶未登入或驗證中，顯示載入狀態
  if (requireAuth && (!validateUserSession(user) || isValidating)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">
            {isValidating ? '正在驗證身份...' : '正在檢查權限...'}
          </p>
        </div>
      </div>
    );
  }

  // 用戶已認證且有效，渲染子組件
  return <>{children}</>;
}