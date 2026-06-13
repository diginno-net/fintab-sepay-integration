'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import type { ProductSyncResult } from './api';

export function SyncResultDisplay({ result }: { result: ProductSyncResult | null }) {
  if (!result) return null;
  return (
    <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/80 px-4 py-4">
      <p className="mb-3 text-sm font-semibold text-emerald-900">Sync hoàn tất</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div><span className="text-zinc-500">Đã sync:</span> <span className="font-semibold text-emerald-700">{result.synced}</span></div>
        <div><span className="text-zinc-500">Bỏ qua:</span> <span className="font-medium text-zinc-700">{result.skipped}</span></div>
        <div><span className="text-zinc-500">Lỗi:</span> <span className="font-medium text-red-700">{result.failed}</span></div>
        <div><span className="text-zinc-500">Tổng trang:</span> <span className="font-medium text-zinc-700">{result.totalPages}</span></div>
      </div>
      {result.errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {result.errors.slice(0, 5).map((e, i) => (
            <p key={i} className="text-xs text-red-600">Lỗi: {e.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function SyncErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>
  );
}

export function SyncButton({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<ProductSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doSync() {
    setIsPending(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<ProductSyncResult>('/v1/products/sync/pancake', {
        method: 'POST',
        body: JSON.stringify({ shopId })
      });
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : 'Sync thất bại.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Shop ID</p>
          <p className="mt-1 max-w-[260px] truncate font-mono text-xs text-zinc-600">{shopId}</p>
        </div>
        <Button type="button" onClick={doSync} disabled={isPending} className="shadow-[0_14px_24px_-18px_rgba(4,120,87,0.6)]">
          {isPending ? 'Đang sync...' : 'Đồng bộ từ Pancake'}
        </Button>
      </div>
      {error && <SyncErrorMessage message={error} />}
      {result && <SyncResultDisplay result={result} />}
    </div>
  );
}
