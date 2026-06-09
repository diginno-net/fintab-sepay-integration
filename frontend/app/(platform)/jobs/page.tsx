import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { getJob, listJobs } from '@/features/jobs/api';
import { getInvoiceJob } from '@/features/invoices/api';
import { InvoiceJobDetail } from '@/features/invoices/invoice-job-detail';
import { BackgroundJobDetail } from '@/features/jobs/background-job-detail';

export default async function JobsPage({
  searchParams
}: {
  searchParams: Promise<{ jobId?: string; invoiceJobId?: string; shopId?: string; type?: string; status?: string }>;
}) {
  const params = await searchParams;
  const jobs = await listJobs({ shopId: params.shopId, type: params.type, status: params.status }).catch(() => []);

  const backgroundJob = params.jobId ? await getJob(params.jobId).catch(() => null) : null;
  const invoiceJob = params.invoiceJobId ? await getInvoiceJob(params.invoiceJobId).catch(() => null) : null;
  const selectedJob = invoiceJob ?? backgroundJob;

  const mode = invoiceJob ? 'invoice' : backgroundJob ? 'background' : 'list';

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Queue"
        title={mode === 'invoice' ? 'Invoice Job' : mode === 'background' ? 'Background Job' : 'Jobs'}
        description={
          mode === 'invoice'
            ? 'Theo dõi hóa đơn nháp và phát hành.'
            : 'Theo dõi background jobs, retry và check status.'
        }
      />

      {mode === 'invoice' && invoiceJob ? (
        <SectionCard title={`Invoice ${String(invoiceJob.id).slice(0, 8)}`}>
          <InvoiceJobDetail job={invoiceJob as Record<string, unknown>} />
        </SectionCard>
      ) : mode === 'background' && backgroundJob ? (
        <SectionCard title={`Background Job ${String(backgroundJob.id).slice(0, 8)}`}>
          <BackgroundJobDetail job={backgroundJob} />
        </SectionCard>
      ) : null}

      <SectionCard title="Filters">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm" name="shopId" defaultValue={params.shopId ?? ''} placeholder="Shop ID" />
          <input className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm" name="type" defaultValue={params.type ?? ''} placeholder="Job type" />
          <input className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm" name="status" defaultValue={params.status ?? ''} placeholder="Status" />
          <button className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white">Filter</button>
        </form>
      </SectionCard>

      <SectionCard title="Recent background jobs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr><th className="py-3">ID</th><th>Type</th><th>Status</th><th>Retries</th><th>Created</th><th>Action</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {jobs.map(job => (
                <tr key={job.id}>
                  <td className="py-3 font-mono text-xs">{job.id.slice(0, 8)}</td>
                  <td className="py-3">{job.type}</td>
                  <td className="py-3">{job.status}</td>
                  <td className="py-3">{job.attempts}/{job.max_attempts}</td>
                  <td className="py-3 text-zinc-500">{new Date(job.created_at).toLocaleDateString('vi-VN')}</td>
                  <td><a className="font-semibold text-emerald-800" href={`/jobs?jobId=${job.id}`}>Open</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {jobs.length === 0 ? <p className="py-4 text-sm text-zinc-500">Chưa có job nào.</p> : null}
      </SectionCard>
    </div>
  );
}
