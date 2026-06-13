'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { apiFetch, ApiClientError } from '@/lib/api/client';

export function OrderSyncButton({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startSync() {
    setError(null);
    startTransition(async () => {
      try {
        await apiFetch(`/v1/pancake/shops/${shopId}/orders/sync`, {
          method: 'POST',
          body: JSON.stringify({ pageSize: 100 })
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Không bắt đầu được đồng bộ Pancake.');
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="secondary" disabled={isPending} onClick={startSync}>
        {isPending ? 'Đang gửi...' : 'Đồng bộ Pancake'}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
