'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { TextInput } from '@/components/forms/input';
import { SelectInput } from '@/components/forms/select';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import { InvoicePreviewSummary } from './invoice-preview-summary';

export function InvoicePreviewForm({ defaultShopId, defaultOrderId }: { defaultShopId: string; defaultOrderId?: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showRaw, setShowRaw] = useState(false);

  function previewAction(formData: FormData) {
    setMessage(null);
    setPreview(null);
    startTransition(async () => {
      try {
        const body = bodyFromForm(formData);
        const data = await apiFetch<Record<string, unknown>>('/v1/invoices/preview', { method: 'POST', body: JSON.stringify(body) });
        setPreview(data);
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không tạo được preview.');
      }
    });
  }

  function createDraft() {
    const form = document.querySelector<HTMLFormElement>('#invoice-preview-form');
    if (!form) return;
    const formData = new FormData(form);
    setMessage(null);
    startTransition(async () => {
      try {
        const data = await apiFetch<{ backgroundJobId: string; invoiceJob: { id: string } }>('/v1/invoices/create-draft', { method: 'POST', body: JSON.stringify(bodyFromForm(formData)) });
        router.push(`/jobs?invoiceJobId=${data.invoiceJob.id}`);
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không tạo được draft job.');
      }
    });
  }

  const hasBlockingWarning = Boolean(
    Array.isArray((preview as { warnings?: Array<{ code: string }> })?.warnings)
    && ((preview as { warnings?: Array<{ code: string }> }).warnings ?? []).some(w => w.code === 'TAX_MAPPING_BLOCKED')
  );

  return (
    <div className="space-y-6">
      <form id="invoice-preview-form" action={previewAction} className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <TextInput label="Shop ID" name="shopId" defaultValue={defaultShopId} required />
        <TextInput label="Pancake order ID" name="orderId" defaultValue={defaultOrderId ?? ''} required />
        <SelectInput label="Invoice type" name="invoiceType" defaultValue="ban_hang"><option value="ban_hang">Bán hàng</option><option value="gtgt">GTGT</option></SelectInput>
        <div className="md:col-span-3 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending}>{isPending ? 'Đang preview...' : 'Preview invoice'}</Button>
          <Button type="button" variant="secondary" onClick={createDraft} disabled={isPending || !preview || hasBlockingWarning}>Create draft job</Button>
          {preview ? (
            <button type="button" onClick={() => setShowRaw(v => !v)} className="text-sm text-zinc-500 underline">{showRaw ? 'Ẩn JSON' : 'Xem JSON'}</button>
          ) : null}
        </div>
      </form>
      {message ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p> : null}
      {preview ? (
        showRaw ? (
          <details className="rounded-2xl border border-zinc-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-600">Raw JSON</summary>
            <pre className="max-h-96 overflow-auto px-4 pb-4 text-xs text-zinc-400">{JSON.stringify(preview, null, 2)}</pre>
          </details>
        ) : (
          <InvoicePreviewSummary data={preview as Parameters<typeof InvoicePreviewSummary>[0]['data']} />
        )
      ) : null}
    </div>
  );
}

function bodyFromForm(formData: FormData) {
  return { shopId: formData.get('shopId'), orderId: formData.get('orderId'), invoiceType: formData.get('invoiceType') };
}
