'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/forms/button';
import { apiFetch } from '@/lib/api/client';

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await apiFetch<{ ok: boolean }>('/v1/auth/logout', { method: 'POST', body: JSON.stringify({}) });
      router.replace('/login');
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleLogout} disabled={isPending}>
      {isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
    </Button>
  );
}
