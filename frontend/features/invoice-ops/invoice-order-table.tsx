'use client';

import { Button } from '@/components/forms/button';
import { ErpTable, erpTd, erpTh } from '@/components/ui/erp-table';
import { CodeCell } from '@/components/ui/code-cell';
import { MoneyText } from '@/components/ui/money-text';
import { StatusPill } from '@/components/ui/status-pill';
import type { InvoiceOrderRow } from './api-client';
import { InvoiceOrderActions } from './invoice-order-actions';

type Props = {
  shopId: string;
  rows: InvoiceOrderRow[];
  loading: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onOpenRequest: (orderId: string) => void;
  onChanged: () => void;
};

const invoiceTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  not_created: 'neutral',
  draft_queued: 'warning',
  draft_created: 'warning',
  issue_queued: 'warning',
  processing: 'warning',
  requires_draft_recreate: 'danger',
  issued: 'success',
  failed: 'danger',
  cancelled: 'neutral'
};

function paymentLabel(row: InvoiceOrderRow): string {
  return row.paymentStatus === 'paid_by_policy' ? 'Đủ điều kiện' : row.paymentStatusLabel;
}

export function InvoiceOrderTable({ shopId, rows, loading, selectedIds, onSelectionChange, onOpenRequest, onChanged }: Props) {
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  return (
    <ErpTable>
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <colgroup>
          <col className="w-9" />
          <col className="w-[120px]" />
          <col className="w-[220px]" />
          <col className="w-[145px]" />
          <col className="w-[135px]" />
          <col className="w-[220px]" />
          <col className="w-[170px]" />
        </colgroup>
        <thead>
          <tr>
            <th className={`${erpTh} w-10`}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => onSelectionChange(allSelected ? [] : rows.map(row => row.orderId))}
                className="size-4 rounded border-line text-accent"
              />
            </th>
            <th className={erpTh}>Đơn hàng</th>
            <th className={erpTh}>Khách hàng</th>
            <th className={`${erpTh} text-right`}>Tổng tiền</th>
            <th className={erpTh}>Thanh toán</th>
            <th className={erpTh}>Hóa đơn</th>
            <th className={`${erpTh} text-right`}>Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {loading ? [...Array(6)].map((_, index) => (
            <tr key={index} className="animate-pulse">
              {[...Array(7)].map((__, cell) => <td key={cell} className={erpTd}><div className="h-4 w-24 rounded bg-surface-muted" /></td>)}
            </tr>
          )) : rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted">Chưa có đơn hàng phù hợp bộ lọc.</td>
            </tr>
          ) : rows.map(row => {
            const selected = selectedIds.includes(row.orderId);
            return (
              <tr key={row.orderId} className={selected ? 'h-11 bg-emerald-50/60' : 'h-11 hover:bg-surface-muted/55'}>
                <td className={erpTd}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onSelectionChange(selected ? selectedIds.filter(id => id !== row.orderId) : [...selectedIds, row.orderId])}
                    className="size-4 rounded border-line text-accent"
                  />
                </td>
                <td className={erpTd}>
                  <CodeCell>#{row.orderNumber ?? row.orderId}</CodeCell>
                  <p className="mt-0.5 truncate text-xs leading-4 text-muted">{row.pancakeStatusLabel}</p>
                </td>
                <td className={erpTd}>
                  <p className="truncate font-medium text-ink">{row.customerName || '-'}</p>
                  <p className="mt-0.5 truncate text-xs leading-4 text-muted">{row.customerEmail || row.customerPhone || '-'}</p>
                </td>
                <td className={`${erpTd} text-right`}><MoneyText>{row.totalFormatted}</MoneyText></td>
                <td className={erpTd}>
                  <span title={row.paymentStatusLabel}>
                    <StatusPill tone={row.paymentStatus === 'paid' || row.paymentStatus === 'paid_by_policy' ? 'success' : row.paymentStatus === 'unpaid' ? 'neutral' : 'warning'}>{paymentLabel(row)}</StatusPill>
                  </span>
                </td>
                <td className={erpTd}>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <StatusPill tone={invoiceTone[row.invoiceStatus] ?? 'neutral'}>{row.invoiceStatusLabel}</StatusPill>
                    {row.invoiceNumber && <span className="truncate font-mono text-xs leading-4 text-muted" title={`Số HĐ: ${row.invoiceNumber}`}>#{row.invoiceNumber}</span>}
                    {row.errorMessage && <p className="max-w-[220px] truncate text-xs text-red-600" title={row.errorMessage}>{row.errorMessage}</p>}
                  </div>
                </td>
                <td className={`${erpTd} text-right`}>
                  <InvoiceOrderActions shopId={shopId} row={row} onOpenRequest={onOpenRequest} onChanged={onChanged} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ErpTable>
  );
}

export function BulkActionBar({ count, filteredDraftCount, totalFilteredCount, onClear, onCreateDraft, onCreateFilteredDrafts, onCreateAllFilteredDrafts, onIssue, pending }: { count: number; filteredDraftCount: number; totalFilteredCount: number; onClear: () => void; onCreateDraft: () => void; onCreateFilteredDrafts: () => void; onCreateAllFilteredDrafts: () => void; onIssue: () => void; pending: boolean }) {
  if (count === 0 && filteredDraftCount === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
      <div>
        <p className="font-semibold text-zinc-950">{count > 0 ? `Đã chọn ${count} đơn` : `${filteredDraftCount} đơn đang lọc có thể tạo nháp`}</p>
        <p className="text-sm text-zinc-600">Có thể tạo nháp cho đơn đang hiển thị hoặc toàn bộ {totalFilteredCount.toLocaleString('vi-VN')} đơn đã lọc.</p>
      </div>
      <div className="flex gap-2">
        {count > 0 ? <Button type="button" variant="secondary" disabled={pending} onClick={onClear}>Bỏ chọn</Button> : null}
        {count > 0 ? <Button type="button" variant="secondary" disabled={pending} onClick={onCreateDraft}>Tạo nháp đã chọn</Button> : null}
        {filteredDraftCount > 0 ? <Button type="button" variant="secondary" disabled={pending} onClick={onCreateFilteredDrafts}>Tạo nháp đơn đang lọc</Button> : null}
        {totalFilteredCount > filteredDraftCount ? <Button type="button" variant="secondary" disabled={pending} onClick={onCreateAllFilteredDrafts}>Tạo nháp toàn bộ đơn đã lọc</Button> : null}
        {count > 0 ? <Button type="button" disabled={pending} onClick={onIssue}>Phát hành đã chọn</Button> : null}
      </div>
    </div>
  );
}
