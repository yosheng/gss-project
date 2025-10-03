import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function signInWithEnvCredentials(username: string, password: string) {
    // 从环境变量中读取用户名和密码
    const envUsername = process.env.NEXT_PUBLIC_USERNAME;
    const envPassword = process.env.NEXT_PUBLIC_PASSWORD;
    // 检查用户名和密码是否匹配环境变量中的值
    if (username === envUsername && password === envPassword) {
        // 如果匹配，返回成功状态，模拟登录成功
        return {
            data: {
                user: {
                    id: 'admin-user-id',
                    email: 'admin@example.com',
                    user_metadata: {
                        name: 'Admin User'
                    }
                },
                session: null
            },
            error: null
        };
    } else {
        // 如果不匹配，返回错误
        return {
            data: null,
            error: {
                message: 'Invalid credentials',
                status: 401
            }
        };
    }
}

/**
 * 驗證用戶會話的有效性
 */
export function validateUserSession(user: User | null): boolean {
  if (!user) return false;
  
  // 檢查用戶對象是否包含必要的屬性
  if (!user.id) return false;
  
  // 檢查用戶 email 是否存在（對於大多數認證系統）
  if (!user.email && !user.user_metadata?.name) return false;
  
  return true;
}

/**
 * 檢查當前會話狀態
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session check error:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Failed to get current session:', error);
    return null;
  }
}

/**
 * 強制刷新會話
 */
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Session refresh error:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return { data: null, error };
  }
}