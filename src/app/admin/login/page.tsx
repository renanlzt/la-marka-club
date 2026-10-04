'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-lamarka-50 text-xs text-lamarka-500">
      Redirecionando para o portal de acesso...
    </div>
  );
}
