'use client';

import { ReactNode } from 'react';
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
      
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}