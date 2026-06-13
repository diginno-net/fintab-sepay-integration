'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { TextInput } from '@/components/forms/input';
import { ApiClientError, apiFetch } from '@/lib/api/client';

type LoginResponse = {
  currentShopId: string | null;
};

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const data = await apiFetch<LoginResponse>('/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.get('email'),
            password: formData.get('password')
          })
        });
        router.push(data.currentShopId ? '/dashboard' : '/onboarding');
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : 'Không đăng nhập được. Vui lòng thử lại.');
      }
    });
  }

  return (
    <form action={onSubmit} className="mt-8 flex flex-col gap-5">
      <TextInput label="Email" type="email" name="email" autoComplete="email" required />
      <TextInput label="Mật khẩu" type="password" name="password" autoComplete="current-password" required />
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </Button>
    </form>
  );
}
