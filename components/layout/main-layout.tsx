'use client';

import { ReactNode, Suspense } from 'react';
import Navigation from './navigation';
import { type RouteKey } from '@/lib/router';

interface MainLayoutProps {
  children: ReactNode;
  currentRoute: RouteKey;
  onNavigate: (route: RouteKey) => void;
  onLogout: () => void;
}

export default function MainLayout({ 
  children, 
  currentRoute, 
  onNavigate, 
  onLogout 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      
      <main className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 text-sm">載入中...</p>
            </div>
          </div>
        }>
          {children}
        </Suspense>
      </main>
    </div>
  );
}