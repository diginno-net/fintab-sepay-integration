'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/status/badge';
import { Button } from '@/components/forms/button';
import { listInvoiceJobs, retryInvoiceJob } from '@/features/invoices/api';
import { InvoiceStatsBar } from '@/features/invoices/invoice-stats-bar';
import { InvoiceTableRow } from '@/features/invoices/invoice-table-row';
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
  tenant_shop_id: string;
};

const STATUS_CONFIG: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }> = {
  draft_create_queued: { label: 'Đang tạo nháp', tone: 'warning' },
  draft_create_polling: { label: 'Đang tạo nháp', tone: 'warning' },
  draft_create_running: { label: 'Đang tạo nháp', tone: 'warning' },
  draft_created: { label: 'Nháp xong', tone: 'warning' },
  issue_queued: { label: 'Đang phát hành', tone: 'warning' },
  issue_polling: { label: 'Đang phát hành', tone: 'warning' },
  issue_running: { label: 'Đang phát hành', tone: 'warning' },
  issued: { label: 'Đã phát hành', tone: 'success' },
  failed: { label: 'Thất bại', tone: 'danger' },
  timeout: { label: 'Hết giờ', tone: 'danger' },
  cancelled: { label: 'Đã hủy', tone: 'neutral' },
};

const STATUS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chưa tạo' },
  { id: 'draft_created', label: 'Đã tạo nháp' },
  { id: 'issued', label: 'Đã phát hành' },
  { id: 'failed', label: 'Lỗi' },
];

const STATUS_MAP: Record<string, string[]> = {
  all: [],
  pending: ['draft_create_queued', 'draft_create_polling', 'draft_create_running'],
  draft_created: ['draft_created'],
  issued: ['issued'],
  failed: ['failed', 'timeout'],
};

export default function InvoicesPage() {
  const [jobs, setJobs] = useState<InvoiceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      try {
        const data = await listInvoiceJobs();
        setJobs(Array.isArray(data) ? data as InvoiceJob[] : []);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    if (status === 'all') return true;
    const targetStatuses = STATUS_MAP[status] || [];
    return targetStatuses.includes(job.status);
  });

  const stats = {
    total: jobs.length,
    issued: jobs.filter((j) => j.status === 'issued').length,
    pending: jobs.filter((j) =>
      ['draft_create_queued', 'draft_create_polling', 'draft_create_running', 'draft_created', 'issue_queued', 'issue_polling', 'issue_running'].includes(j.status)
    ).length,
    failed: jobs.filter((j) => ['failed', 'timeout'].includes(j.status)).length,
  };

  const handleRetry = async (jobId: string) => {
    try {
      await retryInvoiceJob(jobId);
      const data = await listInvoiceJobs();
      setJobs(Array.isArray(data) ? data as InvoiceJob[] : []);
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const handleBulkRetry = async () => {
    for (const id of selectedIds) {
      await handleRetry(id);
    }
    setSelectedIds([]);
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SePay"
        title="Quản lý hóa đơn điện tử"
        description="Theo dõi và xử lý hóa đơn điện tử từ Pancake POS"
      >
        <Link className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800" href="/invoices/preview">
          + Tạo hóa đơn
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Tổng đơn" value={stats.total} tone="neutral" />
        <StatCard title="Đã phát hành" value={stats.issued} tone="success" />
        <StatCard title="Chờ xử lý" value={stats.pending} tone="warning" />
        <StatCard title="Lỗi" value={stats.failed} tone="danger" />
      </div>

      <SectionCard className="p-0">
        <div className="border-b border-zinc-200">
          <Tabs
            tabs={STATUS_TABS}
            activeTab={status}
            onTabChange={setStatus}
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-3">
            <span className="text-sm text-zinc-700">
              {selectedIds.length} mục đã chọn
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedIds([])}>
                Bỏ chọn
              </Button>
              <Button size="sm" variant="primary" onClick={handleBulkRetry}>
                Retry đã chọn
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filteredJobs.length > 0 && selectedIds.length === filteredJobs.length}
                    onChange={() => {
                      if (selectedIds.length === filteredJobs.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(filteredJobs.map((j) => j.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-700"
                  />
                </th>
                <th className="px-4 py-3">Đơn</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Mã SePay</th>
                <th className="px-4 py-3">Mã hóa đơn</th>
                <th className="px-4 py-3">Luồng</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th className="px-4 py-3">Lỗi</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(10)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-zinc-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-zinc-500">
                    Chưa có hóa đơn nào
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className={`hover:bg-zinc-50 ${selectedIds.includes(job.id) ? 'bg-emerald-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(job.id)}
                        onChange={() => {
                          if (selectedIds.includes(job.id)) {
                            setSelectedIds(selectedIds.filter((id) => id !== job.id));
                          } else {
                            setSelectedIds([...selectedIds, job.id]);
                          }
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/orders/${job.source_order_id}`} className="font-medium text-zinc-900 hover:text-emerald-700">
                        #{job.source_order_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {job.invoice_type === 'gtgt' ? 'GTGT' : 'Bán hàng'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_CONFIG[job.status]?.tone || 'neutral'}>
                        {STATUS_CONFIG[job.status]?.label || job.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {job.sepay_tracking_code ? (
                        <span title={job.sepay_tracking_code}>{job.sepay_tracking_code.slice(0, 12)}...</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {job.invoice_number || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-400">
                        {job.status === 'issued' ? '✓ Hoàn tất' : job.status === 'failed' ? '✗ Lỗi' : '○ Chờ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDate(job.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-red-600">
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
                        {job.status === 'failed' && (
                          <Button size="sm" variant="secondary" onClick={() => handleRetry(job.id)}>
                            Retry
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
