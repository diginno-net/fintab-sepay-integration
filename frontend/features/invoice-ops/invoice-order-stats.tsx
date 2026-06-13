import { StatCard } from '@/components/ui/stat-card';
import type { InvoiceOrderStats } from './api-client';

export function InvoiceOrderStatsBar({ stats }: { stats: InvoiceOrderStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard title="Tổng đơn" value={stats.totalOrders} tone="neutral" />
      <StatCard title="Đã phát hành" value={stats.issued} tone="success" />
      <StatCard title="Chờ xử lý" value={stats.processing + stats.draftCreated + stats.notCreated} tone="warning" />
      <StatCard title="Lỗi / cần xử lý" value={stats.failed + stats.requiresAttention} tone="danger" />
    </div>
  );
}
