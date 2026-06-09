'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { TextInput } from '@/components/forms/input';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import type { MaskedPancakeConfig } from '@/features/shops/api';

export function PancakeConfigForm({ shopId, config }: { shopId: string; config: MaskedPancakeConfig }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await apiFetch(`/v1/shops/${shopId}/pancake/config`, {
          method: 'PUT',
          body: JSON.stringify({
            shop_id: formData.get('shop_id'),
            shop_name: formData.get('shop_name'),
            api_key: valueOrUndefined(formData.get('api_key')),
            webhook_secret: valueOrUndefined(formData.get('webhook_secret')),
            default_order_status_for_issue: [3, 16],
            allow_create_draft_statuses: [1, 2, 3, 16]
          })
        });
        setMessage('Đã lưu cấu hình Pancake.');
        router.refresh();
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không lưu được cấu hình Pancake.');
      }
    });
  }

  function testConnection() {
    setMessage(null);
    startTransition(async () => {
      try {
        await apiFetch(`/v1/shops/${shopId}/test-pancake`, { method: 'POST', body: JSON.stringify({}) });
        setMessage('Kết nối Pancake thành công.');
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không kiểm tra được kết nối.');
      }
    });
  }

  return (
    <form action={save} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <TextInput label="Pancake shop ID" name="shop_id" defaultValue={config.shop_id} required />
        <TextInput label="Tên shop" name="shop_name" defaultValue={config.shop_name} required />
        <TextInput label="API key" name="api_key" type="password" placeholder={config.has_api_key ? '••••••••' : ''} helper="Write-only. Để trống nếu không đổi." />
        <TextInput label="Webhook secret" name="webhook_secret" type="password" placeholder={config.has_webhook_secret ? '••••••••' : ''} helper="Write-only. Để trống nếu không đổi." />
      </div>
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu cấu hình'}</Button>
        <Button type="button" variant="secondary" onClick={testConnection} disabled={isPending}>{isPending ? 'Đang kiểm tra...' : 'Test connection'}</Button>
      </div>
    </form>
  );
}

function valueOrUndefined(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text : undefined;
}
