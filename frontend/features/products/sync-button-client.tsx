'use client';

import { useState } from 'react';
import { Button } from '@/components/forms/button';
import type { ProductSyncResult } from './api';

export function SyncResultDisplay({ result }: { result: ProductSyncResult | null }) {
  if (!result) return null;
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg font-semibold text-emerald-800">Sync hoàn tất</span>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-4">
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
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<ProductSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doSync() {
    setIsPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/v1/products/sync/pancake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shopId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Sync thất bại' }));
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync thất bại.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">Sync từ Pancake shop</p>
          <p className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">{shopId}</p>
        </div>
        <Button type="button" onClick={doSync} disabled={isPending}>
          {isPending ? 'Đang sync...' : 'Đồng bộ từ Pancake'}
        </Button>
      </div>
      {error && <SyncErrorMessage message={error} />}
      {result && <SyncResultDisplay result={result} />}
    </div>
  );
}
