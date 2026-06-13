'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/forms/button';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import { downloadArtifact } from '@/features/invoices/download-artifact';
import { createDraftForOrderClient, issueOrderInvoiceClient, type InvoiceOrderRow } from './api-client';

type Props = {
  shopId: string;
  row: InvoiceOrderRow;
  onOpenRequest: (orderId: string) => void;
  onChanged: () => void;
};

export function InvoiceOrderActions({ shopId, row, onOpenRequest, onChanged }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        onChanged();
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Thao tác thất bại.');
      }
    });
  }

  function download(type: 'pdf' | 'xml') {
    if (!row.invoiceJobId) return;
    setError(null);
    startTransition(async () => {
      try {
        const data = await apiFetch<unknown>(`/v1/invoices/jobs/${row.invoiceJobId}/download/${type}`, { method: 'GET' });
        await downloadArtifact(row.invoiceJobId!, data as Parameters<typeof downloadArtifact>[1], type === 'xml' ? 'xml' : undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Không tải được ${type.toUpperCase()}.`);
      }
    });
  }

  const downloadOnly = (row.actions.canDownloadPdf || row.actions.canDownloadXml || row.invoiceJobId)
    && !row.actions.canEditInvoiceInfo
    && !row.actions.canCreateDraft
    && !row.actions.canRecreateDraft
    && !row.actions.canIssue;

  if (row.invoiceStatus === 'issued' || downloadOnly) {
    const hasDownload = row.actions.canDownloadPdf || row.actions.canDownloadXml;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-end gap-2 whitespace-nowrap text-xs font-semibold text-ink">
          {row.actions.canDownloadPdf && (
            <button type="button" className="hover:text-accent" disabled={isPending} onClick={() => download('pdf')}>PDF</button>
          )}
          {row.actions.canDownloadPdf && row.actions.canDownloadXml && <span className="text-line">·</span>}
          {row.actions.canDownloadXml && (
            <button type="button" className="hover:text-accent" disabled={isPending} onClick={() => download('xml')}>XML</button>
          )}
          {row.invoiceJobId && hasDownload && <span className="text-line">·</span>}
          {row.invoiceJobId && <Link className="hover:text-accent" href={`/jobs?invoiceJobId=${row.invoiceJobId}`}>Chi tiết</Link>}
        </div>
        {error && <p className="max-w-[180px] truncate text-right text-xs text-red-600" title={error}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
        {row.actions.canEditInvoiceInfo && (
          <Button type="button" size="sm" variant="table" disabled={isPending} onClick={() => onOpenRequest(row.orderId)}>
            Cấu hình
          </Button>
        )}
        {(row.actions.canCreateDraft || row.actions.canRecreateDraft) && (
          <Button type="button" size="sm" disabled={isPending} onClick={() => run(() => createDraftForOrderClient(shopId, row.orderId))}>
            {row.actions.canRecreateDraft ? 'Tạo lại nháp' : 'Tạo nháp'}
          </Button>
        )}
        {row.actions.canIssue && (
          <Button type="button" size="sm" disabled={isPending} onClick={() => run(() => issueOrderInvoiceClient(shopId, row.orderId))}>
            Phát hành
          </Button>
        )}
        {row.actions.canDownloadPdf && (
          <Button type="button" size="sm" variant="table" disabled={isPending} onClick={() => download('pdf')}>PDF</Button>
        )}
        {row.actions.canDownloadXml && (
          <Button type="button" size="sm" variant="table" disabled={isPending} onClick={() => download('xml')}>XML</Button>
        )}
        {row.invoiceJobId && (
          <Link href={`/jobs?invoiceJobId=${row.invoiceJobId}`}>
            <Button type="button" size="sm" variant="table">Chi tiết</Button>
          </Link>
        )}
      </div>
      {error && <p className="max-w-xs text-xs text-red-600">{error}</p>}
    </div>
  );
}
