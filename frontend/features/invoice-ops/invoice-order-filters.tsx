'use client';

import { Tabs } from '@/components/ui/tabs';
import type { InvoiceOrderStats } from './api-client';

type Props = {
  status: string;
  search: string;
  paidOnly: boolean;
  completedOnly: boolean;
  completedDays: number;
  stats: InvoiceOrderStats;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onPaidOnlyChange: (paidOnly: boolean) => void;
  onCompletedOnlyChange: (completedOnly: boolean) => void;
  onCompletedDaysChange: (completedDays: number) => void;
};

export function InvoiceOrderFilters({ status, search, paidOnly, completedOnly, completedDays, stats, onStatusChange, onSearchChange, onPaidOnlyChange, onCompletedOnlyChange, onCompletedDaysChange }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-4">
      <Tabs
        className="border-b-0"
        activeTab={status}
        onTabChange={onStatusChange}
        tabs={[
          { id: 'all', label: 'Tất cả', count: stats.totalOrders },
          { id: 'not_created', label: 'Chưa tạo', count: stats.notCreated },
          { id: 'draft_created', label: 'Đã tạo nháp', count: stats.draftCreated },
          { id: 'issued', label: 'Đã phát hành', count: stats.issued },
          { id: 'requires_attention', label: 'Cần xử lý', count: stats.requiresAttention + stats.failed }
        ]}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 text-sm font-medium text-zinc-700 sm:flex-row sm:items-center sm:gap-5">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={completedOnly}
              onChange={event => onCompletedOnlyChange(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-700"
            />
            Chỉ đơn hoàn thành
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={paidOnly}
              onChange={event => onPaidOnlyChange(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-700"
            />
            Chỉ đơn đã thanh toán
          </label>
          <select
            value={completedDays}
            onChange={event => onCompletedDaysChange(Number(event.target.value))}
            disabled={!completedOnly}
            className="h-10 rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-emerald-700 disabled:opacity-50"
          >
            <option value={3}>3 ngày gần nhất</option>
            <option value={7}>7 ngày gần nhất</option>
            <option value={30}>30 ngày gần nhất</option>
          </select>
        </div>
        <input
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Tìm mã đơn, khách hàng, email, số hóa đơn..."
          className="h-12 min-w-0 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-sm outline-none transition focus:border-emerald-700 lg:w-[420px]"
        />
      </div>
    </div>
  );
}
