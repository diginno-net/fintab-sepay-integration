'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DevLoginPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('http://localhost:4000/v1/auth/dev-login', { credentials: 'include' })
      .then(res => res.json())
      .then(() => router.push('/dashboard'))
      .catch(() => router.push('/login'));
  }, [router]);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#f7f6f2]">
      <p className="text-zinc-500">Dev bypass login...</p>
    </main>
  );
}
