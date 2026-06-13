'use client';

import { Button } from '@/components/forms/button';
import type { InvoiceOrderPagination } from './api-client';

type Props = {
  pagination: InvoiceOrderPagination;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function PaginationControls({ pagination, loading, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(pagination.totalPages, 1);
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
      <div>
        Trang <span className="font-semibold text-zinc-950">{pagination.page}</span> / <span className="font-semibold text-zinc-950">{totalPages}</span>
        <span className="ml-2 text-zinc-400">({pagination.totalEntries.toLocaleString('vi-VN')} đơn từ Pancake)</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pagination.pageSize}
          onChange={event => onPageSizeChange(Number(event.target.value))}
          disabled={loading}
          className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 outline-none focus:border-emerald-700"
        >
          {[30, 50, 100].map(size => <option key={size} value={size}>{size} / trang</option>)}
        </select>
        <Button type="button" size="sm" variant="secondary" disabled={loading || pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>Trước</Button>
        <Button type="button" size="sm" variant="secondary" disabled={loading || !pagination.hasNextPage} onClick={() => onPageChange(pagination.page + 1)}>Sau</Button>
      </div>
    </div>
  );
}
