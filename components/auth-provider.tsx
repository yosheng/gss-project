'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { validateUserSession } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  setAuth: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  setAuth: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          setError('認證系統初始化失敗');
          setUser(null);
        } else {
          const sessionUser = session?.user ?? null;
          
          // 驗證會話有效性
          if (sessionUser && !validateUserSession(sessionUser)) {
            console.warn('Invalid user session detected');
            setUser(null);
            setError('會話無效，請重新登入');
          } else {
            setUser(sessionUser);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Failed to get initial session:', err);
        setError('無法連接到認證服務');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        
        try {
          const sessionUser = session?.user ?? null;
          
          // 處理不同的認證事件
          switch (event) {
            case 'SIGNED_IN':
              if (sessionUser && validateUserSession(sessionUser)) {
                setUser(sessionUser);
                setError(null);
              } else {
                setUser(null);
                setError('登入失敗：無效的用戶資訊');
              }
              break;
              
            case 'SIGNED_OUT':
              setUser(null);
              setError(null);
              break;
              
            case 'TOKEN_REFRESHED':
              if (sessionUser && validateUserSession(sessionUser)) {
                setUser(sessionUser);
                setError(null);
              } else {
                setUser(null);
                setError('會話更新失敗');
              }
              break;
              
            default:
              // 對於其他事件，驗證用戶會話
              if (sessionUser && validateUserSession(sessionUser)) {
                setUser(sessionUser);
                setError(null);
              } else {
                setUser(null);
              }
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          setUser(null);
          setError('認證狀態更新失敗');
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setAuth: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}