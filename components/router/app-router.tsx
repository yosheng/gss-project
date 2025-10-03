'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { routeConfigs, getRouteConfig, getDefaultRoute, type RouteKey } from '@/lib/router';
import RouteGuard from './route-guard';
import MainLayout from '@/components/layout/main-layout';

interface AppRouterProps {
  user: User | null;
  onLogout: () => void;
}

export default function AppRouter({ user, onLogout }: AppRouterProps) {
  const [currentRoute, setCurrentRoute] = useState<RouteKey>(getDefaultRoute());

  const handleNavigate = (route: RouteKey) => {
    const routeConfig = getRouteConfig(route);
    if (routeConfig) {
      setCurrentRoute(routeConfig.key);
    }
  };

  const currentRouteConfig = getRouteConfig(currentRoute);
  
  if (!currentRouteConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">找不到指定的頁面</p>
        </div>
      </div>
    );
  }

  const PageComponent = currentRouteConfig.component;

  return (
    <RouteGuard user={user} requireAuth={currentRouteConfig.requireAuth}>
      <MainLayout 
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onLogout={onLogout}
      >
        <PageComponent />
      </MainLayout>
    </RouteGuard>
  );
}