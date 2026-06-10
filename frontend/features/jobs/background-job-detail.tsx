'use client';

import Link from 'next/link';
import { maskError } from '@/lib/mask-error';

type BackgroundJobRecord = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  max_attempts: number;
  poll_attempts: number;
  max_poll_attempts: number;
  invoice_job_id: string | null;
  payload_json: Record<string, unknown>;
  last_error_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export function BackgroundJobDetail({ job }: { job: BackgroundJobRecord }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div><span className="text-zinc-500">Type</span><p className="font-semibold">{job.type}</p></div>
        <div><span className="text-zinc-500">Status</span><p className="font-semibold">{job.status}</p></div>
        <div><span className="text-zinc-500">Retries</span><p className="font-semibold">{job.attempts}/{job.max_attempts}</p></div>
        <div><span className="text-zinc-500">Poll</span><p className="font-semibold">{job.poll_attempts}/{job.max_poll_attempts}</p></div>
      </div>
      {job.invoice_job_id && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-emerald-600">Invoice Job</p>
          <p className="mb-2 font-mono text-xs text-emerald-700">{job.invoice_job_id}</p>
          <Link href={`/jobs?invoiceJobId=${job.invoice_job_id}`} className="inline-flex items-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
            Mở hóa đơn →
          </Link>
        </div>
      )}
      {job.last_error_json ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-red-700">Last error (masked)</p>
          <pre className="max-h-48 overflow-auto rounded-xl bg-zinc-950 p-3 text-xs text-red-300">{maskError(job.last_error_json)}</pre>
        </div>
      ) : null}
      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-700">Payload</p>
        <pre className="max-h-48 overflow-auto rounded-xl bg-zinc-950 p-3 text-xs text-zinc-100">{JSON.stringify(job.payload_json, null, 2)}</pre>
      </div>
    </div>
  );
}
