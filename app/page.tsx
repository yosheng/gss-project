'use client';

import { useState, useEffect } from 'react';
import Login from '@/components/login';
import EnhancedHome from '@/components/enhanced-home';
import { useAuth } from '@/components/auth-provider';

export default function Page() {
  const { user, loading } = useAuth();
  const [showHome, setShowHome] = useState(false);

  useEffect(() => {
    if (user) {
      setShowHome(true);
    } else {
      setShowHome(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">Initializing Employee Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showHome ? (
        <EnhancedHome onLogout={() => setShowHome(false)} />
      ) : (
        <Login onLoginSuccess={() => setShowHome(true)} />
      )}
    </>
  );
}