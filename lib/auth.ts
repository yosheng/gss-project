import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

const AUTH_COOKIE_NAME = 'gss_auth';
const AUTH_COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

interface AuthCookieData {
  user: { id: string; email: string; user_metadata: { name: string } };
  expiresAt: number;
}

export function saveAuthCookie(user: AuthCookieData['user']): void {
  if (typeof window === 'undefined') return;
  const data: AuthCookieData = {
    user,
    expiresAt: Date.now() + AUTH_COOKIE_MAX_AGE * 1000,
  };
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; max-age=${AUTH_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function loadAuthCookie(): AuthCookieData['user'] | null {
  if (typeof window === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
    if (!match) return null;
    const data: AuthCookieData = JSON.parse(decodeURIComponent(match[1]));
    if (Date.now() > data.expiresAt) {
      clearAuthCookie();
      return null;
    }
    return data.user;
  } catch {
    clearAuthCookie();
    return null;
  }
}

export function clearAuthCookie(): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${AUTH_COOKIE_NAME}=; max-age=0; path=/`;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  clearAuthCookie();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function signInWithEnvCredentials(username: string, password: string) {
    // 从环境变量中读取用户名和密码
    const envUsername = process.env.NEXT_PUBLIC_USERNAME;
    const envPassword = process.env.NEXT_PUBLIC_PASSWORD;
    // 检查用户名和密码是否匹配环境变量中的值
    if (username === envUsername && password === envPassword) {
        const user = {
            id: 'admin-user-id',
            email: 'admin@example.com',
            user_metadata: { name: 'Admin User' },
        };
        saveAuthCookie(user);
        return { data: { user, session: null }, error: null };
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