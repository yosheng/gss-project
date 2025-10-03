'use client';

import { ReactNode } from 'react';
import { User } from '@supabase/supabase-js';

interface RouteGuardProps {
  user: User | null;
  children: ReactNode;
  requireAuth?: boolean;
}

export default function RouteGuard({ user, children, requireAuth = true }: RouteGuardProps) {
  // 如果不需要認證，直接渲染子組件
  if (!requireAuth) {
    return <>{children}</>;
  }

  // 如果需要認證但用戶未登入，返回 null（由父組件處理重定向）
  if (requireAuth && !user) {
    return null;
  }

  // 用戶已認證，渲染子組件
  return <>{children}</>;
}