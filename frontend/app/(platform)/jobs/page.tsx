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

type BackgroundJob = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  max_attempts: number;
  invoice_job_id: string | null;
  created_at: string;
  updated_at: string;
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
          listJobsClient({}).catch(() => []),
          listInvoiceJobsClient().catch(() => [])
        ]);
        setBackgroundJobs(Array.isArray(jobs) ? jobs as unknown as BackgroundJob[] : []);
        setInvoiceJobs(Array.isArray(invoices) ? invoices as Record<string, unknown>[] : []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRetry = async () => {
    const data = await listInvoiceJobsClient().catch(() => []);
    setInvoiceJobs(Array.isArray(data) ? data as Record<string, unknown>[] : []);
  };

  const currentMode = invoiceJob ? 'invoice' : backgroundJob ? 'background' : mode;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Queue"
        title={currentMode === 'invoice' ? 'Invoice Job' : currentMode === 'background' ? 'Background Job' : 'Nhật ký hóa đơn'}
        description={
          currentMode === 'invoice'
            ? 'Theo dõi hóa đơn nháp và phát hành.'
            : currentMode === 'background'
            ? 'Background job detail.'
            : 'Theo dõi background jobs, retry và check status.'
        }
      />

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
            { id: 'jobs', label: 'Jobs' },
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
            <SectionCard title={`${invoiceJob ? 'Invoice' : 'Background'} Job ${String(invoiceJob?.id || backgroundJob?.id).slice(0, 8)}`}>
              {invoiceJob ? (
                <InvoiceJobDetail job={invoiceJob} />
              ) : backgroundJob ? (
                <BackgroundJobDetail job={backgroundJob} />
              ) : null}
            </SectionCard>
          )}

          <SectionCard title="Filters">
            <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <input className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm" name="shopId" placeholder="Shop ID" />
              <input className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm" name="type" placeholder="Job type" />
              <input className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm" name="status" placeholder="Status" />
              <button className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white">Filter</button>
            </form>
          </SectionCard>

          <SectionCard title={`Recent background jobs (${backgroundJobs.length})`}>
            {loading ? (
              <div className="animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="mb-3 h-12 rounded bg-zinc-100" />
                ))}
              </div>
            ) : backgroundJobs.length === 0 ? (
              <p className="py-4 text-sm text-zinc-500">Chưa có job nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                      <th className="py-3">ID</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Retries</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {backgroundJobs.map(job => (
                      <tr key={job.id}>
                        <td className="py-3 font-mono text-xs">{job.id.slice(0, 8)}</td>
                        <td className="py-3">{job.type}</td>
                        <td className="py-3">
                          <Badge tone={job.status === 'succeeded' ? 'success' : job.status === 'failed' ? 'danger' : 'neutral'}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="py-3">{job.attempts}/{job.max_attempts}</td>
                        <td className="py-3 text-zinc-500">{new Date(job.created_at).toLocaleDateString('vi-VN')}</td>
                        <td>
                          {job.invoice_job_id ? (
                            <Link className="font-semibold text-emerald-800" href={`/jobs?invoiceJobId=${job.invoice_job_id}`}>
                              Mở hóa đơn
                            </Link>
                          ) : (
                            <Link className="font-semibold text-emerald-800" href={`/jobs?jobId=${job.id}`}>
                              Open
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
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

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Đang tải...</div>}>
      <JobsContent />
    </Suspense>
  );
}
