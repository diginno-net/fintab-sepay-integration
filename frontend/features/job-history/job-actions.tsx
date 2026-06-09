'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/forms/button';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import { downloadArtifact, viewArtifact } from '@/features/invoices/download-artifact';

type JobStatus =
  | 'draft_create_queued'
  | 'draft_create_polling'
  | 'draft_created'
  | 'issue_queued'
  | 'issue_polling'
  | 'issued'
  | 'failed'
  | 'timeout'
  | 'cancelled';

const TERMINAL_STATUSES: JobStatus[] = ['issued', 'failed', 'timeout', 'cancelled'];

function isTerminal(s: string): s is JobStatus {
  return TERMINAL_STATUSES.includes(s as JobStatus);
}

export function JobActions({ invoiceJobId, status: initialStatus }: { invoiceJobId: string; status: string }) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (isTerminal(currentStatus)) return;
    const timer = window.setInterval(async () => {
      try {
        const data = await apiFetch<Record<string, unknown>>(`/v1/invoices/jobs/${invoiceJobId}`, { cache: 'no-store' });
        const s = String(data.status ?? '');
        setCurrentStatus(s);
        if (isTerminal(s)) clearInterval(timer as unknown as number);
      } catch { /* silently ignore polling errors */ }
    }, 3000);
    return () => window.clearInterval(timer as unknown as number);
  }, [invoiceJobId, currentStatus]);

  async function call(
    pathPattern: string,
    method: 'GET' | 'POST' = 'POST',
    payload?: Record<string, unknown>
  ) {
    setError(null);
    setMessage(null);
    const path = pathPattern.replace('{invoiceJobId}', invoiceJobId);
    startTransition(async () => {
      try {
        const data = await apiFetch<Record<string, unknown>>(path, {
          method,
          body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined
        });
        const job = (data.invoiceJob ?? data) as Record<string, unknown>;
        if (typeof job.status === 'string') setCurrentStatus(job.status);
        setMessage('Đã gửi yêu cầu.');
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Thao tác thất bại.');
      }
    });
  }

  async function handleDownload(mode: 'view' | 'download') {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const data = await apiFetch<unknown>(`/v1/invoices/jobs/${invoiceJobId}/download/pdf`, {
          method: 'GET'
        });
        const artifact = data as Parameters<typeof viewArtifact>[1];
        if (mode === 'view') {
          await viewArtifact(invoiceJobId, artifact);
        } else {
          await downloadArtifact(invoiceJobId, artifact);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được PDF.');
      }
    });
  }

  const terminal = isTerminal(currentStatus);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-zinc-700">
        Status: <span className={currentStatus === 'issued' ? 'text-emerald-700' : currentStatus === 'failed' ? 'text-red-600' : 'text-zinc-900'}>{currentStatus}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {!terminal && (
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => call('/v1/invoices/jobs/{invoiceJobId}/refresh', 'POST')}>
            Refresh invoice
          </Button>
        )}
        {(currentStatus === 'failed' || currentStatus === 'timeout') && (
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => call('/v1/invoices/jobs/{invoiceJobId}/retry', 'POST')}>
            Retry
          </Button>
        )}
        {currentStatus === 'draft_created' && (
          <>
            <Button type="button" disabled={isPending} onClick={() => call('/v1/invoices/issue', 'POST', { invoiceJobId })}>
              Issue
            </Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => handleDownload('view')}>
              View PDF
            </Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => handleDownload('download')}>
              Download PDF
            </Button>
          </>
        )}
        {currentStatus === 'issued' && (
          <>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => handleDownload('view')}>
              View PDF
            </Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => handleDownload('download')}>
              Download PDF
            </Button>
          </>
        )}
      </div>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
