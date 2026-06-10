'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { listInvoiceJobsClient } from '@/features/invoices/api-client';

type InvoiceStats = {
  total: number;
  issued: number;
  pending: number;
  failed: number;
};

type InvoiceStatsBarProps = {
  shopId?: string;
  className?: string;
};

export function InvoiceStatsBar({ shopId, className = '' }: InvoiceStatsBarProps) {
  const [stats, setStats] = useState<InvoiceStats>({ total: 0, issued: 0, pending: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const jobs = await listInvoiceJobsClient();
        const jobArray: Record<string, unknown>[] = Array.isArray(jobs) ? jobs as Record<string, unknown>[] : (jobs as { data?: Record<string, unknown>[] })?.data || [];

        let filtered = jobArray;
        if (shopId) {
          filtered = jobArray.filter((j) => j.tenant_shop_id === shopId);
        }

        const issued = filtered.filter((j) => j.status === 'issued').length;
        const pending = filtered.filter((j) =>
          ['draft_create_queued', 'draft_create_polling', 'draft_create_running', 'draft_created', 'issue_queued', 'issue_polling', 'issue_running'].includes(j.status as string)
        ).length;
        const failed = filtered.filter((j) =>
          ['failed', 'timeout'].includes(j.status as string)
        ).length;

        setStats({
          total: filtered.length,
          issued,
          pending,
          failed
        });
      } catch {
        setStats({ total: 0, issued: 0, pending: 0, failed: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [shopId]);

  if (loading) {
    return (
      <div className={`grid grid-cols-2 gap-4 lg:grid-cols-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white px-5 py-4 animate-pulse">
            <div className="h-4 w-20 rounded bg-zinc-100" />
            <div className="mt-2 h-8 w-16 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-4 lg:grid-cols-4 ${className}`}>
      <StatCard title="Tổng đơn" value={stats.total} tone="neutral" />
      <StatCard title="Đã phát hành" value={stats.issued} tone="success" />
      <StatCard title="Chờ xử lý" value={stats.pending} tone="warning" />
      <StatCard title="Lỗi" value={stats.failed} tone="danger" />
    </div>
  );
}
