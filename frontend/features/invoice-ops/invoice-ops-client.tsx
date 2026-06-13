'use client';

import { useEffect, useState, useTransition } from 'react';
import { ErpPageHeader } from '@/components/layout/erp-page-header';
import { ErpPagination } from '@/components/ui/erp-pagination';
import { Button } from '@/components/forms/button';
import { ApiClientError } from '@/lib/api/client';
import { BulkActionBar, InvoiceOrderTable } from './invoice-order-table';
import { InvoiceOrderFilters } from './invoice-order-filters';
import { InvoiceRequestPanel } from './invoice-request-panel';
import { bulkCreateDraftByFilterClient, bulkCreateDraftClient, bulkIssueClient, listInvoiceOrdersClient, startPancakeOrderSyncClient, type InvoiceOrderStats, type InvoiceOrderRow, type InvoiceOrderPagination, type PancakeOrderSyncRun } from './api-client';

const emptyStats: InvoiceOrderStats = {
  totalOrders: 0,
  notCreated: 0,
  draftCreated: 0,
  issued: 0,
  processing: 0,
  failed: 0,
  requiresAttention: 0
};

const emptyPagination: InvoiceOrderPagination = {
  page: 1,
  pageSize: 100,
  totalEntries: 0,
  totalPages: 0,
  hasNextPage: false
};

export function InvoiceOpsClient({ defaultShopId, shopName }: { defaultShopId: string; shopName?: string | null }) {
  const [rows, setRows] = useState<InvoiceOrderRow[]>([]);
  const [stats, setStats] = useState<InvoiceOrderStats>(emptyStats);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [paidOnly, setPaidOnly] = useState(false);
  const [completedOnly, setCompletedOnly] = useState(true);
  const [completedDays, setCompletedDays] = useState(3);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [pagination, setPagination] = useState<InvoiceOrderPagination>(emptyPagination);
  const [source, setSource] = useState<'snapshot' | 'live'>('live');
  const [syncRun, setSyncRun] = useState<PancakeOrderSyncRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [panelOrderId, setPanelOrderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const filteredDraftOrderIds = rows.filter(row => row.eligibleForDraft).map(row => row.orderId).slice(0, 100);

  async function load() {
    if (!defaultShopId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listInvoiceOrdersClient({ shopId: defaultShopId, status, search, page, pageSize, paidOnly, completedOnly, completedDays });
      setRows(data.rows);
      setStats(data.stats);
      setPagination(data.pagination);
      setSource(data.source);
      setSyncRun(data.syncRun);
      setSelectedIds(ids => ids.filter(id => data.rows.some(row => row.orderId === id)));
    } catch (err) {
      setRows([]);
      setStats(emptyStats);
      setPagination({ ...emptyPagination, page, pageSize });
      setSource('live');
      setSyncRun(null);
      setError(err instanceof ApiClientError ? err.message : 'Không tải được danh sách hóa đơn.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 250);
    return () => window.clearTimeout(timer);
  }, [defaultShopId, status, search, page, pageSize, paidOnly, completedOnly, completedDays]);

  useEffect(() => {
    if (!syncRun || !['queued', 'running'].includes(syncRun.status)) return;
    const timer = window.setTimeout(() => { void load(); }, 3000);
    return () => window.clearTimeout(timer);
  }, [syncRun?.id, syncRun?.status, syncRun?.current_page]);

  function changeStatus(nextStatus: string) {
    setStatus(nextStatus);
    setPage(1);
  }

  function changeSearch(nextSearch: string) {
    setSearch(nextSearch);
    setPage(1);
  }

  function changePaidOnly(nextPaidOnly: boolean) {
    setPaidOnly(nextPaidOnly);
    setPage(1);
  }

  function changeCompletedOnly(nextCompletedOnly: boolean) {
    setCompletedOnly(nextCompletedOnly);
    setPage(1);
  }

  function changeCompletedDays(nextCompletedDays: number) {
    setCompletedDays(nextCompletedDays);
    setPage(1);
  }

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  function runBulk(kind: 'draft' | 'issue') {
    const orderIds = kind === 'draft' ? selectedIds : selectedIds;
    runBulkForOrderIds(kind, orderIds);
  }

  function runBulkForOrderIds(kind: 'draft' | 'issue', orderIds: string[]) {
    setMessage(null);
    setError(null);
    if (orderIds.length === 0) {
      setError(kind === 'draft' ? 'Không có đơn đủ điều kiện tạo nháp trong bộ lọc hiện tại.' : 'Chưa chọn đơn để phát hành.');
      return;
    }
    startTransition(async () => {
      try {
        const result = kind === 'draft'
          ? await bulkCreateDraftClient(defaultShopId, orderIds)
          : await bulkIssueClient(defaultShopId, orderIds);
        const ok = result.results.filter(item => item.ok).length;
        const failed = result.results.length - ok;
        setMessage(`Đã xử lý ${ok} đơn${failed ? `, ${failed} đơn bị bỏ qua/lỗi` : ''}.`);
        setSelectedIds([]);
        await load();
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Không xử lý được thao tác hàng loạt.');
      }
    });
  }

  function createDraftsForFilteredRows() {
    runBulkForOrderIds('draft', filteredDraftOrderIds);
  }

  function createDraftsForAllFilteredRows() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await bulkCreateDraftByFilterClient({ shopId: defaultShopId, status, search, paidOnly, completedOnly, completedDays, limit: 500 });
        setMessage(`Đã tạo nháp ${result.created}/${result.attempted} đơn đủ điều kiện trong ${result.totalMatched.toLocaleString('vi-VN')} đơn đã lọc${result.skipped ? `, ${result.skipped} đơn lỗi/bỏ qua` : ''}.`);
        setSelectedIds([]);
        await load();
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Không tạo được hóa đơn cho toàn bộ đơn đã lọc.');
      }
    });
  }

  function startSync() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await startPancakeOrderSyncClient(defaultShopId, 100, { completedOnly, completedDays });
        setSyncRun(result.syncRun);
        setMessage('Đã đưa tác vụ đồng bộ đơn Pancake vào hàng đợi. Worker sẽ xử lý nền.');
        await load();
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Không bắt đầu được đồng bộ Pancake.');
      }
    });
  }

  return (
    <div className="space-y-4">
      <ErpPageHeader
        breadcrumbs={[{ label: 'Vận hành' }, { label: 'Hóa đơn' }]}
        title="Hóa đơn"
        count={pagination.totalEntries || stats.totalOrders}
        backHref="/dashboard"
        actions={<><Button type="button" variant="secondary" size="sm" onClick={startSync} disabled={loading || isPending || syncRun?.status === 'running' || syncRun?.status === 'queued'}>Đồng bộ</Button><Button type="button" variant="secondary" size="sm" onClick={() => void load()} disabled={loading || isPending}>Làm mới</Button><button className="h-9 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink hover:bg-surface-muted">Xuất</button></>}
      />

      <SyncStatusCard source={source} syncRun={syncRun} shopId={defaultShopId} shopName={shopName ?? null} />
      <InvoiceOrderFilters
        status={status}
        search={search}
        paidOnly={paidOnly}
        completedOnly={completedOnly}
        completedDays={completedDays}
        stats={stats}
        onStatusChange={changeStatus}
        onSearchChange={changeSearch}
        onPaidOnlyChange={changePaidOnly}
        onCompletedOnlyChange={changeCompletedOnly}
        onCompletedDaysChange={changeCompletedDays}
      />
      <BulkActionBar count={selectedIds.length} filteredDraftCount={filteredDraftOrderIds.length} totalFilteredCount={pagination.totalEntries} pending={isPending} onClear={() => setSelectedIds([])} onCreateDraft={() => runBulk('draft')} onCreateFilteredDrafts={createDraftsForFilteredRows} onCreateAllFilteredDrafts={createDraftsForAllFilteredRows} onIssue={() => runBulk('issue')} />

      {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <InvoiceOrderTable
        shopId={defaultShopId}
        rows={rows}
        loading={loading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onOpenRequest={setPanelOrderId}
        onChanged={() => void load()}
      />

      <div className="rounded-xl border border-line bg-white px-4 py-3">
        <ErpPagination page={pagination.page} totalPages={Math.max(pagination.totalPages, 1)} pageSize={pagination.pageSize} totalItems={pagination.totalEntries} itemLabel="hóa đơn" onPageChange={setPage} />
        <div className="mt-3 flex gap-2">
          {[30, 50, 100].map(size => <Button key={size} type="button" variant={size === pageSize ? 'primary' : 'secondary'} size="sm" disabled={loading} onClick={() => changePageSize(size)}>{size}/trang</Button>)}
        </div>
      </div>

      <InvoiceRequestPanel
        open={Boolean(panelOrderId)}
        shopId={defaultShopId}
        orderId={panelOrderId}
        onClose={() => setPanelOrderId(null)}
        onSaved={() => void load()}
      />
    </div>
  );
}

function SyncStatusCard({ source, syncRun, shopId, shopName }: { source: 'snapshot' | 'live'; syncRun: PancakeOrderSyncRun | null; shopId: string; shopName: string | null }) {
  const running = syncRun && ['queued', 'running'].includes(syncRun.status);
  const progress = syncRun && syncRun.total_pages > 0 ? Math.round((syncRun.current_page / syncRun.total_pages) * 100) : 0;
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-ink">Nguồn: {source === 'snapshot' ? 'Snapshot đã đồng bộ' : 'Live Pancake API'} · Shop: <span className="font-semibold text-ink">{shopName ?? shopId}</span></p>
          <p className="mt-1">{syncRun ? `Sync gần nhất: ${syncRun.status} · page ${syncRun.current_page}/${syncRun.total_pages || '?'} · ${syncRun.synced_count.toLocaleString('vi-VN')} đơn · paid ${syncRun.paid_count.toLocaleString('vi-VN')}` : 'Shop này chưa có snapshot. Màn hình đang đọc live page từ Pancake.'}</p>
        </div>
        {running ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Đang đồng bộ {progress}%</span> : null}
      </div>
      {running ? <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${Math.max(progress, 5)}%` }} /></div> : null}
    </div>
  );
}
