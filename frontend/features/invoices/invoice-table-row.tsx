'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/status/badge';
import { Button } from '@/components/forms/button';
import { invoiceStatus } from '@/features/operations/status-labels';

type InvoiceJob = {
  id: string;
  source_order_id: string;
  invoice_type: 'gtgt' | 'ban_hang';
  status: string;
  sepay_tracking_code?: string;
  sepay_reference_code?: string;
  invoice_number?: string;
  last_error_json?: Record<string, unknown>;
  updated_at: string;
  tenant_shop_id: string;
};

type InvoiceTableRowProps = {
  job: InvoiceJob;
  onRetry?: (jobId: string) => void;
  className?: string;
};

const FLOW_STEPS = [
  'pending',
  'draft_create_queued',
  'draft_create_running',
  'draft_create_polling',
  'draft_created',
  'issue_queued',
  'issue_running',
  'issue_polling',
  'issued',
];

export function InvoiceTableRow({ job, onRetry, className = '' }: InvoiceTableRowProps) {
  const statusConfig = invoiceStatus(job.status);
  const currentStepIndex = FLOW_STEPS.indexOf(job.status);
  const isInProgress = currentStepIndex > 0 && currentStepIndex < FLOW_STEPS.length - 1;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRetry?.(job.id);
  };

  return (
    <>
      <td className="px-4 py-3">
        <Link href={`/orders/${job.source_order_id}${job.tenant_shop_id ? `?shopId=${job.tenant_shop_id}` : ''}`} className="font-medium text-zinc-900 hover:text-emerald-700">
          #{job.source_order_id}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600">
        {job.invoice_type === 'gtgt' ? 'GTGT' : 'Bán hàng'}
      </td>
      <td className="px-4 py-3">
        <Badge tone={statusConfig.tone}>{statusConfig.label}</Badge>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-600">
        {job.sepay_tracking_code ? (
          <span title={job.sepay_tracking_code}>{job.sepay_tracking_code.slice(0, 12)}...</span>
        ) : '-'}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-600">
        {job.sepay_reference_code ? (
          <span title={job.sepay_reference_code}>{job.sepay_reference_code.slice(0, 12)}...</span>
        ) : '-'}
      </td>
      <td className="px-4 py-3">
        {isInProgress ? (
          <div className="flex items-center gap-1">
            {FLOW_STEPS.slice(1, -1).map((step, idx) => (
              <div
                key={step}
                className={`h-1.5 w-3 rounded-full ${
                  idx <= currentStepIndex - 1 ? 'bg-emerald-600' : 'bg-zinc-200'
                }`}
              />
            ))}
          </div>
        ) : (
          <span className="text-xs text-zinc-400">
            {job.status === 'issued' ? '✓ Hoàn tất' : job.status === 'failed' ? '✗ Lỗi' : '○ Chờ'}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        {formatDate(job.updated_at)}
      </td>
      <td className="px-4 py-3 text-sm text-red-600">
        {job.last_error_json ? (
          <span title={JSON.stringify(job.last_error_json)}>
            {String((job.last_error_json as { message?: string }).message || 'Lỗi').slice(0, 20)}...
          </span>
        ) : '-'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href={`/jobs?invoiceJobId=${job.id}`}>
            <Button size="sm" variant="ghost">Xem</Button>
          </Link>
          {job.status === 'failed' && onRetry && (
            <Button size="sm" variant="secondary" onClick={handleRetry}>Thử lại</Button>
          )}
          {job.status === 'issued' && (
            <Button size="sm" variant="ghost">PDF</Button>
          )}
        </div>
      </td>
    </>
  );
}
