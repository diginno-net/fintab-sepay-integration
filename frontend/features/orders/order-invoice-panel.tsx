'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/status/badge';
import { Button } from '@/components/forms/button';
import { listInvoiceJobs, getInvoiceJob } from '@/features/invoices/api';
import { downloadArtifact } from '@/features/invoices/download-artifact';
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
};

type OrderInvoicePanelProps = {
  orderId: string;
  shopId: string;
  className?: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft_create_queued: 'Đang tạo nháp',
  draft_create_polling: 'Đang tạo nháp',
  draft_create_running: 'Đang tạo nháp',
  draft_created: 'Nháp xong',
  issue_queued: 'Đang phát hành',
  issue_polling: 'Đang phát hành',
  issue_running: 'Đang phát hành',
  issued: 'Đã phát hành',
  failed: 'Thất bại',
  timeout: 'Hết giờ',
};

export function OrderInvoicePanel({ orderId, shopId, className = '' }: OrderInvoicePanelProps) {
  const [invoiceJobs, setInvoiceJobs] = useState<InvoiceJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const jobs = await listInvoiceJobs();
        const jobArray = Array.isArray(jobs) ? jobs as InvoiceJob[] : [];
        const orderInvoices = jobArray.filter(j => j.source_order_id === orderId);
        setInvoiceJobs(orderInvoices);
      } catch {
        setInvoiceJobs([]);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, [orderId]);

  const handleDownloadPDF = async (invoiceJobId: string) => {
    try {
      const data = await getInvoiceJob(invoiceJobId);
      const job = data as Record<string, unknown>;
      if (job.status === 'issued') {
        await downloadArtifact(invoiceJobId, {});
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4">
          <div className="h-4 w-32 rounded bg-zinc-100" />
          <div className="mt-2 h-8 w-full rounded bg-zinc-100" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-950">Hóa đơn điện tử</h3>
        <Link href={`/invoices/preview?shopId=${shopId}&orderId=${orderId}`}>
          <Button size="sm">+ Tạo hóa đơn</Button>
        </Link>
      </div>

      {invoiceJobs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm text-zinc-500">Chưa có hóa đơn cho đơn hàng này.</p>
          <Link href={`/invoices/preview?shopId=${shopId}&orderId=${orderId}`} className="mt-2 inline-block text-sm font-semibold text-emerald-700">
            Tạo hóa đơn mới
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {invoiceJobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-zinc-900">
                      {job.invoice_type === 'gtgt' ? 'GTGT' : 'Bán hàng'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      job.status === 'issued' ? 'bg-emerald-100 text-emerald-800' :
                      job.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {STATUS_LABELS[job.status] || job.status}
                    </span>
                  </div>
                  {job.invoice_number && (
                    <p className="font-mono text-xs text-zinc-500">
                      Mã hóa đơn: <span className="font-semibold text-emerald-700">{job.invoice_number}</span>
                    </p>
                  )}
                  {job.sepay_reference_code && (
                    <p className="font-mono text-xs text-zinc-500">
                      Reference: {job.sepay_reference_code}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/jobs?invoiceJobId=${job.id}`}>
                    <Button size="sm" variant="ghost">Xem</Button>
                  </Link>
                  {job.status === 'issued' && (
                    <Button size="sm" variant="secondary" onClick={() => handleDownloadPDF(job.id)}>
                      PDF
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
