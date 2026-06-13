'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { Tabs } from '@/components/ui/tabs';
import { listJobsClient, type JobEntry } from '@/features/jobs/api-client';
import { getInvoiceJobClient, listInvoiceJobsClient } from '@/features/invoices/api-client';
import { InvoiceJobDetail } from '@/features/invoices/invoice-job-detail';
import { BackgroundJobDetail } from '@/features/jobs/background-job-detail';
import { InvoiceLogTable } from '@/features/invoices/invoice-log-table';
import { Badge } from '@/components/status/badge';
import Link from 'next/link';
import { backgroundJobStatus, backgroundJobTypeLabel } from '@/features/operations/status-labels';

type BackgroundJob = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  max_attempts: number;
  invoice_job_id: string | null;
  created_at: string;
  updated_at: string;
  dead_lettered_at?: string | null;
};

function JobsContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'jobs' | 'logs'>('jobs');
  const [backgroundJob, setBackgroundJob] = useState<JobEntry | null>(null);
  const [invoiceJob, setInvoiceJob] = useState<Record<string, unknown> | null>(null);
  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJob[]>([]);
  const [invoiceJobs, setInvoiceJobs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const jobId = searchParams.get('jobId');
  const invoiceJobId = searchParams.get('invoiceJobId');
  const shopId = searchParams.get('shopId');

  const loadJobDetail = useCallback(async () => {
    if (!jobId && !invoiceJobId) {
      setBackgroundJob(null);
      setInvoiceJob(null);
      return;
    }

    setLoading(true);
    try {
      if (invoiceJobId) {
        const inv = await getInvoiceJobClient(invoiceJobId).catch(() => null);
        setInvoiceJob(inv);
        setBackgroundJob(null);
      } else if (jobId) {
        const bg = await listJobsClient({}).catch(() => []);
        const found = (Array.isArray(bg) ? bg : []).find((j: JobEntry) => j.id === jobId) as JobEntry | undefined;
        setBackgroundJob(found ?? null);
        if (found?.invoice_job_id) {
          const inv = await getInvoiceJobClient(found.invoice_job_id).catch(() => null);
          setInvoiceJob(inv);
        } else {
          setInvoiceJob(null);
        }
      }
    } catch {
      setBackgroundJob(null);
      setInvoiceJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId, invoiceJobId]);

  useEffect(() => {
    loadJobDetail();
  }, [loadJobDetail]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [jobs, invoices] = await Promise.all([
          listJobsClient({ shopId: shopId ?? undefined }).catch(() => []),
          listInvoiceJobsClient({ shopId: shopId ?? undefined }).catch(() => [])
        ]);
        setBackgroundJobs(Array.isArray(jobs) ? jobs as unknown as BackgroundJob[] : []);
        setInvoiceJobs(Array.isArray(invoices) ? invoices as Record<string, unknown>[] : []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [shopId]);

  const handleRetry = async () => {
    const data = await listInvoiceJobsClient({ shopId: shopId ?? undefined }).catch(() => []);
    setInvoiceJobs(Array.isArray(data) ? data as Record<string, unknown>[] : []);
  };

  const currentMode = invoiceJob ? 'invoice' : backgroundJob ? 'background' : mode;
  const runningCount = backgroundJobs.filter(job => job.status === 'running').length;
  const failedCount = backgroundJobs.filter(job => job.status === 'failed').length;
  const queuedCount = backgroundJobs.filter(job => job.status === 'queued').length;
  const deadLetterCount = backgroundJobs.filter(job => job.dead_lettered_at).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Hàng đợi"
        title={currentMode === 'invoice' ? 'Tác vụ hóa đơn' : currentMode === 'background' ? 'Tác vụ nền' : 'Nhật ký hóa đơn'}
        description={
          currentMode === 'invoice'
            ? 'Theo dõi hóa đơn nháp và phát hành.'
            : currentMode === 'background'
            ? 'Chi tiết tác vụ nền.'
            : 'Theo dõi tác vụ nền, thử lại và kiểm tra trạng thái.'
        }
      />

      <section className="grid gap-3 md:grid-cols-4">
        <OpsMetric label="Đang chạy" value={runningCount} helper="Worker đang giữ lock" tone="warning" />
        <OpsMetric label="Chờ xử lý" value={queuedCount} helper="Đến lượt theo run_after" tone="neutral" />
        <OpsMetric label="Worker lỗi" value={failedCount} helper="Có thể cần thử lại" tone="danger" />
        <OpsMetric label="Dừng retry" value={deadLetterCount} helper="Hết số lần thử" tone="danger" />
      </section>

      {(backgroundJob || invoiceJob) && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBackgroundJob(null);
              setInvoiceJob(null);
            }}
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            ← Quay lại danh sách
          </button>
        </div>
      )}

      <div className="border-b border-zinc-200">
        <Tabs
          tabs={[
            { id: 'jobs', label: 'Tác vụ' },
            { id: 'logs', label: 'Nhật ký hóa đơn' }
          ]}
          activeTab={mode}
          onTabChange={(tab) => {
            setMode(tab as 'jobs' | 'logs');
            if (tab === 'logs') {
              setBackgroundJob(null);
              setInvoiceJob(null);
            }
          }}
        />
      </div>

      {mode === 'logs' ? (
        <SectionCard title={`Nhật ký hóa đơn (${invoiceJobs.length})`} className="p-0">
          {loading ? (
            <div className="animate-pulse p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="mb-3 h-12 rounded bg-zinc-100" />
              ))}
            </div>
          ) : invoiceJobs.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              Chưa có nhật ký hóa đơn.
            </div>
          ) : (
            <InvoiceLogTable
              jobs={invoiceJobs as unknown as Array<{
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
              }>}
              onRetry={handleRetry}
            />
          )}
        </SectionCard>
      ) : (
        <>
          {(invoiceJob || backgroundJob) && (
            <SectionCard title={`${invoiceJob ? 'Tác vụ hóa đơn' : 'Tác vụ nền'} ${String(invoiceJob?.id || backgroundJob?.id).slice(0, 8)}`}>
              {invoiceJob ? (
                <InvoiceJobDetail job={invoiceJob} />
              ) : backgroundJob ? (
                <BackgroundJobDetail job={backgroundJob} />
              ) : null}
            </SectionCard>
          )}

          <SectionCard title="Bộ lọc vận hành" className="p-4">
            <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <input className="h-11 rounded-xl border border-line bg-white/60 px-3 text-sm outline-none transition focus:border-accent" name="shopId" defaultValue={shopId ?? ''} placeholder="Shop ID" />
              <input className="h-11 rounded-xl border border-line bg-white/60 px-3 text-sm outline-none transition focus:border-accent" name="type" placeholder="Tạo nháp, phát hành..." />
              <input className="h-11 rounded-xl border border-line bg-white/60 px-3 text-sm outline-none transition focus:border-accent" name="status" placeholder="queued, running, failed" />
              <button className="h-11 rounded-full bg-accent px-5 text-sm font-semibold text-white transition active:translate-y-px active:scale-[0.98]">Lọc</button>
            </form>
          </SectionCard>

          <SectionCard title={`Tác vụ nền gần đây (${backgroundJobs.length})`} className="overflow-hidden p-0">
            <div className="border-b border-line bg-surface-muted/70 px-5 py-3 text-sm text-muted">
              Worker status cho biết tác vụ nền đã chạy ra sao. Kết quả nghiệp vụ hóa đơn nằm trong trạng thái hóa đơn.
            </div>
            {loading ? (
              <div className="animate-pulse p-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="mb-3 h-12 rounded bg-zinc-100" />
                ))}
              </div>
            ) : backgroundJobs.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-zinc-500">Chưa có tác vụ nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-white text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                      <th className="px-5 py-3">Job</th>
                      <th className="px-5 py-3">Loại tác vụ</th>
                      <th className="px-5 py-3">Worker status</th>
                      <th className="px-5 py-3">Lần thử</th>
                      <th className="px-5 py-3">Thời điểm</th>
                      <th className="px-5 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {backgroundJobs.map(job => {
                      const status = backgroundJobStatus(job.status, job.dead_lettered_at);
                      const href = job.invoice_job_id
                        ? `/jobs?${new URLSearchParams({ ...(shopId ? { shopId } : {}), invoiceJobId: job.invoice_job_id }).toString()}`
                        : `/jobs?${new URLSearchParams({ ...(shopId ? { shopId } : {}), jobId: job.id }).toString()}`;
                      return (
                        <tr key={job.id} className="transition hover:bg-surface-muted/45">
                          <td className="px-5 py-3"><span className="font-mono text-xs font-semibold text-ink">{job.id.slice(0, 8)}</span></td>
                          <td className="px-5 py-3"><p className="font-medium text-ink">{backgroundJobTypeLabel(job.type)}</p><p className="mt-1 font-mono text-[0.68rem] text-muted">{job.type}</p></td>
                          <td className="px-5 py-3"><Badge tone={status.tone}>{status.label}</Badge></td>
                          <td className="px-5 py-3 font-mono text-xs tabular-nums text-ink">{job.attempts}/{job.max_attempts}</td>
                          <td className="px-5 py-3 text-muted">{new Date(job.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="px-5 py-3 text-right"><Link className="inline-flex min-h-8 items-center rounded-full border border-line bg-white/60 px-3 text-xs font-semibold text-ink transition hover:border-accent/40 hover:bg-surface-muted" href={href}>{job.invoice_job_id ? 'Mở hóa đơn' : 'Chi tiết'}</Link></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

function OpsMetric({ label, value, helper, tone }: { label: string; value: number; helper: string; tone: 'neutral' | 'warning' | 'danger' }) {
  const toneClass = tone === 'danger' ? 'text-red-700' : tone === 'warning' ? 'text-amber-700' : 'text-ink';
  return (
    <div className="rounded-[1.25rem] border border-line bg-surface px-4 py-4 shadow-warm-sm">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{helper}</p>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Đang tải...</div>}>
      <JobsContent />
    </Suspense>
  );
}
