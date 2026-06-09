'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { ApiClientError, apiFetch } from '@/lib/api/client';

export function ProductImportForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function action(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await apiFetch<Record<string, unknown>>('/v1/products/import', { method: 'POST', body: formData });
        setMessage(`Import xong: updated ${String(result.updated ?? 0)}, skipped ${String(result.skipped ?? 0)}, failed ${String(result.failed ?? 0)}.`);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không import được sản phẩm.');
      }
    });
  }

  return (
    <form action={action} className="flex flex-col gap-4 md:flex-row md:items-end">
      <label className="block flex-1">
        <span className="text-sm font-medium text-zinc-800">File Fintab Excel</span>
        <input className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm" type="file" name="file" accept=".xlsx,.xls" required />
      </label>
      <Button type="submit" disabled={isPending}>{isPending ? 'Đang import...' : 'Import products'}</Button>
      {message ? <p className="text-sm text-zinc-600 md:basis-full">{message}</p> : null}
    </form>
  );
}
