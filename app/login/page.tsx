'use client';

import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import Login from '@/components/login';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (_: User) => {
    router.replace('/work-order');
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}
