import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { listInvoiceJobs } from '@/features/invoices/api';
import Link from 'next/link';

export default async function InvoicesPage() {
  const jobs = await listInvoiceJobs().catch(() => []);
  const STATUS_LABELS: Record<string, string> = {
    draft_create_queued: 'Đang tạo nháp',
    draft_create_polling: 'Đang tạo nháp',
    draft_created: 'Nháp xong',
    issue_queued: 'Đang phát hành',
    issue_polling: 'Đang phát hành',
    issued: 'Đã phát hành',
    failed: 'Thất bại',
    timeout: 'Hết giờ',
  };
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="SePay"
        title="Invoices"
        description="Preview, create draft, issue và download hóa đơn."
      >
        <Link className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white" href="/invoices/preview">
          New preview
        </Link>
      </PageHeader>
      <SectionCard title="Invoice jobs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr><th className="py-3">Order</th><th>Loại</th><th>Status</th><th>Reference</th><th>Action</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {jobs.map((job: Record<string, unknown>) => (
                <tr key={String(job.id)}>
                  <td className="py-3 font-medium">{String(job.source_order_id ?? '-')}</td>
                  <td className="py-3">{job.invoice_type === 'gtgt' ? 'GTGT' : 'Bán hàng'}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      job.status === 'issued' ? 'bg-emerald-100 text-emerald-800' :
                      job.status === 'failed' ? 'bg-red-100 text-red-700' :
                      job.status === 'draft_created' ? 'bg-blue-100 text-blue-700' :
                      'bg-zinc-100 text-zinc-600'
                    }`}>
                      {STATUS_LABELS[String(job.status ?? '')] ?? String(job.status ?? '-')}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-xs">{String(job.sepay_reference_code ?? '-')}</td>
                  <td><Link className="font-semibold text-emerald-800" href={`/jobs?invoiceJobId=${String(job.id)}`}>Open job</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {jobs.length === 0 ? <p className="py-4 text-sm text-zinc-600">Chưa có invoice job.</p> : null}
      </SectionCard>
    </div>
  );
}
