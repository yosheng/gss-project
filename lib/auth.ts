import { supabase } from './supabase';

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
    debugger
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