'use client';

import { useState } from 'react';
import { Badge } from '@/components/status/badge';
import { Button } from '@/components/forms/button';
import { listInvoiceJobs, retryInvoiceJob } from '@/features/invoices/api';
import Link from 'next/link';

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
  created_at: string;
  request_payload_json?: Record<string, unknown>;
  response_json?: Record<string, unknown>;
};

type InvoiceLogTableProps = {
  jobs: InvoiceJob[];
  onRetry?: (jobId: string) => void;
  className?: string;
};

const STATUS_CONFIG: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }> = {
  draft_create_queued: { label: 'Tạo nháp', tone: 'warning' },
  draft_create_polling: { label: 'Tạo nháp', tone: 'warning' },
  draft_create_running: { label: 'Tạo nháp', tone: 'warning' },
  draft_created: { label: 'Nháp xong', tone: 'warning' },
  issue_queued: { label: 'Phát hành', tone: 'warning' },
  issue_polling: { label: 'Phát hành', tone: 'warning' },
  issue_running: { label: 'Phát hành', tone: 'warning' },
  issued: { label: 'Đã phát hành', tone: 'success' },
  failed: { label: 'Thất bại', tone: 'danger' },
  timeout: { label: 'Hết giờ', tone: 'danger' },
  cancelled: { label: 'Đã hủy', tone: 'neutral' },
};

const FLOW_STEPS = ['pending', 'draft_create_queued', 'draft_create_running', 'draft_create_polling', 'draft_created', 'issue_queued', 'issue_running', 'issue_polling', 'issued'];

export function InvoiceLogTable({ jobs, onRetry, className = '' }: InvoiceLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleRetry = async (jobId: string) => {
    setRetryingIds(new Set([...retryingIds, jobId]));
    try {
      await retryInvoiceJob(jobId);
      onRetry?.(jobId);
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

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

  const getErrorMessage = (errorJson?: Record<string, unknown>) => {
    if (!errorJson) return null;
    return (errorJson as { message?: string }).message || String(errorJson);
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-zinc-200 bg-white ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <th className="w-10 py-3 px-4" />
              <th className="py-3 px-4">Đơn</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Mã hóa đơn</th>
              <th className="py-3 px-4">Mã SePay</th>
              <th className="py-3 px-4">Luồng</th>
              <th className="py-3 px-4">Cập nhật</th>
              <th className="py-3 px-4">Lỗi</th>
              <th className="py-3 px-4">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {jobs.map((job) => {
              const statusConfig = STATUS_CONFIG[job.status] || { label: job.status, tone: 'neutral' as const };
              const currentStepIndex = FLOW_STEPS.indexOf(job.status);
              const isInProgress = currentStepIndex > 0 && currentStepIndex < FLOW_STEPS.length - 1 && job.status !== 'issued';
              const isExpanded = expandedRows.has(job.id);
              const errorMsg = getErrorMessage(job.last_error_json);

              return (
                <>
                  <tr key={job.id} className="hover:bg-zinc-50">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleExpand(job.id)}
                        className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/orders/${job.source_order_id}`} className="font-medium text-zinc-900 hover:text-emerald-700">
                        #{job.source_order_id}
                      </Link>
                      <p className="text-xs text-zinc-500">{job.invoice_type === 'gtgt' ? 'GTGT' : 'Bán hàng'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={statusConfig.tone}>{statusConfig.label}</Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {job.invoice_number || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-zinc-500">
                      {job.sepay_reference_code || job.sepay_tracking_code || '-'}
                    </td>
                    <td className="py-3 px-4">
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
                      ) : job.status === 'issued' ? (
                        <span className="text-xs text-emerald-600">✓ Hoàn tất</span>
                      ) : job.status === 'failed' || job.status === 'timeout' ? (
                        <span className="text-xs text-red-600">✗ Lỗi</span>
                      ) : (
                        <span className="text-xs text-zinc-400">○ Chờ</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-500">
                      {formatDate(job.updated_at)}
                    </td>
                    <td className="py-3 px-4 text-xs text-red-600">
                      {errorMsg ? (
                        <span title={errorMsg} className="cursor-help">
                          {errorMsg.slice(0, 25)}...
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/jobs?invoiceJobId=${job.id}`}>
                          <Button size="sm" variant="ghost">Xem</Button>
                        </Link>
                        {(job.status === 'failed' || job.status === 'timeout') && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={retryingIds.has(job.id)}
                            onClick={() => handleRetry(job.id)}
                          >
                            {retryingIds.has(job.id) ? '...' : 'Retry'}
                          </Button>
                        )}
                        {job.status === 'issued' && (
                          <Link href={`/jobs?invoiceJobId=${job.id}`}>
                            <Button size="sm" variant="ghost">PDF</Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${job.id}-expanded`} className="bg-zinc-50">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Payload gửi SePay</p>
                            <pre className="max-h-40 overflow-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
                              {JSON.stringify(job.request_payload_json || {}, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Response từ SePay</p>
                            <pre className="max-h-40 overflow-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
                              {JSON.stringify(job.response_json || {}, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
