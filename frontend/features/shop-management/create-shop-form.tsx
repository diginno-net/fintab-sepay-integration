'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { TextInput } from '@/components/forms/input';
import { ApiClientError, apiFetch } from '@/lib/api/client';

export function CreateShopForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function action(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await apiFetch('/v1/tenant-shops', {
          method: 'POST',
          body: JSON.stringify({
            external_shop_id: formData.get('external_shop_id'),
            shop_name: formData.get('shop_name'),
            config_json: {}
          })
        });
        setMessage('Đã tạo shop.');
        router.refresh();
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không tạo được shop.');
      }
    });
  }

  return (
    <form action={action} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <TextInput label="Pancake shop ID" name="external_shop_id" required />
      <TextInput label="Tên shop" name="shop_name" required />
      <Button type="submit" disabled={isPending}>{isPending ? 'Đang tạo...' : 'Tạo shop'}</Button>
      {message ? <p className="md:col-span-3 text-sm text-zinc-600">{message}</p> : null}
    </form>
  );
}
