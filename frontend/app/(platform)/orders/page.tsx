import Link from 'next/link';
import { ErpPageHeader } from '@/components/layout/erp-page-header';
import { ErpPagination } from '@/components/ui/erp-pagination';
import { ErpTable, erpTd, erpTh } from '@/components/ui/erp-table';
import { CodeCell } from '@/components/ui/code-cell';
import { MoneyText } from '@/components/ui/money-text';
import { StatusPill } from '@/components/ui/status-pill';
import { Button } from '@/components/forms/button';
import { getCurrentSession } from '@/features/auth/session';
import { extractOrderRows, listOrders, orderId, orderStatus, orderTotal, orderDate, orderCustomerName } from '@/features/orders/api';
import { getPancakePaymentStatus } from '@/features/orders/order-field-utils';
import { OrderSyncButton } from '@/features/orders/order-sync-button';
import { pancakeOrderStatusLabel } from '@/features/operations/status-labels';

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ shopId?: string; status?: string; search?: string; page?: string; pageSize?: string; paidOnly?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const shopId = params.shopId ?? session?.currentShopId ?? session?.shops[0]?.id;
  const page = positiveInt(params.page, 1);
  const pageSize = Math.min(positiveInt(params.pageSize, 30), 100);
  const paidOnly = params.paidOnly === 'true';
  const ordersPayload = shopId ? await listOrders(shopId, { status: params.status, search: params.search, page, pageSize, paidOnly }).catch(() => null) : null;
  const orders = extractOrderRows(ordersPayload);
  const pagination = ordersPayload?.pagination ?? { page, pageSize, totalEntries: orders.length, totalPages: 1, hasNextPage: false };

  return (
    <div className="space-y-4">
      <ErpPageHeader
        breadcrumbs={[{ label: 'Vận hành' }, { label: 'Đơn hàng' }]}
        title="Đơn hàng"
        backHref="/dashboard"
        actions={<>{shopId ? <OrderSyncButton shopId={shopId} /> : null}<button className="h-9 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink hover:bg-surface-muted">Bộ lọc</button><button className="h-9 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink hover:bg-surface-muted">Xuất</button></>}
      />

      <div className="border-b border-line bg-surface px-4 pb-4">
        <form className="grid gap-2 md:grid-cols-[180px_minmax(260px,520px)_auto_auto] md:items-end">
          <input type="hidden" name="shopId" value={shopId ?? ''} />
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="pageSize" value={pageSize} />
          <input className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-accent" name="status" defaultValue={params.status ?? ''} placeholder="Trạng thái" />
          <input className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-accent" name="search" defaultValue={params.search ?? ''} placeholder="Tìm mã đơn, tên khách, SĐT" />
          <label className="flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm text-ink">
            <input type="checkbox" name="paidOnly" value="true" defaultChecked={paidOnly} className="size-4 rounded border-line text-accent" />
            Đã thanh toán
          </label>
          <button className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white">Lọc</button>
        </form>
      </div>

      <ErpTable footer={<ErpPagination page={pagination.page} totalPages={Math.max(pagination.totalPages, 1)} pageSize={pageSize} totalItems={pagination.totalEntries} itemLabel="đơn" hrefForPage={(nextPage) => ordersPageHref({ shopId, status: params.status, search: params.search, paidOnly, page: nextPage, pageSize })} />}>
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <colgroup>
            <col className="w-9" />
            <col className="w-[100px]" />
            <col className="w-[210px]" />
            <col className="w-[150px]" />
            <col className="w-[160px]" />
            <col className="w-[140px]" />
            <col className="w-[170px]" />
            <col className="w-[150px]" />
          </colgroup>
          <thead>
            <tr>
              <th className={`${erpTh} w-10`}><input type="checkbox" className="size-4 rounded border-line" /></th>
              <th className={erpTh}>Đơn</th>
              <th className={erpTh}>Khách hàng</th>
              <th className={`${erpTh} text-right`}>Tổng tiền</th>
              <th className={erpTh}>Thanh toán</th>
              <th className={erpTh}>Trạng thái</th>
              <th className={erpTh}>Ngày tạo</th>
              <th className={`${erpTh} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {orders.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">Chưa có dữ liệu hoặc shop chưa cấu hình Pancake.</td></tr>
            ) : orders.map(order => <OrderRow key={orderId(order)} order={order} shopId={shopId} />)}
          </tbody>
        </table>
      </ErpTable>
    </div>
  );
}

function OrderRow({ order, shopId }: { order: Record<string, unknown>; shopId?: string }) {
  const payment = getPancakePaymentStatus(order);
  return (
    <tr className="h-11 hover:bg-surface-muted/55">
      <td className={erpTd}><input type="checkbox" className="size-4 rounded border-line" /></td>
      <td className={erpTd}><CodeCell>#{orderId(order)}</CodeCell><p className="mt-0.5 truncate text-xs leading-4 text-muted">{pancakeOrderStatusLabel(orderStatus(order))}</p></td>
      <td className={erpTd}><p className="truncate font-medium">{orderCustomerName(order)}</p><p className="mt-0.5 text-xs leading-4 text-muted">Pancake POS</p></td>
      <td className={`${erpTd} text-right`}><MoneyText>{orderTotal(order)}</MoneyText></td>
      <td className={erpTd} title={!payment.canCreateInvoice ? payment.reason : undefined}><StatusPill tone={payment.canCreateInvoice ? 'success' : payment.status === 'unpaid' ? 'warning' : 'neutral'}>{payment.canCreateInvoice ? 'Đã thanh toán' : payment.label}</StatusPill></td>
      <td className={erpTd}><StatusPill>{pancakeOrderStatusLabel(orderStatus(order))}</StatusPill></td>
      <td className={`${erpTd} whitespace-nowrap text-[0.82rem]`}>{orderDate(order)}</td>
      <td className={`${erpTd} text-right`}>
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          <Link href={`/orders/${orderId(order)}?shopId=${shopId}`}><Button size="sm" variant="table">Chi tiết</Button></Link>
          {payment.canCreateInvoice ? <Link href={`/invoices/preview?shopId=${shopId}&orderId=${orderId(order)}`}><Button size="sm">Tạo nháp</Button></Link> : <StatusPill tone="neutral">Chưa đủ</StatusPill>}
        </div>
      </td>
    </tr>
  );
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function ordersPageHref(input: { shopId?: string; status?: string; search?: string; paidOnly: boolean; page: number; pageSize: number }): string {
  const params = new URLSearchParams();
  if (input.shopId) params.set('shopId', input.shopId);
  if (input.status) params.set('status', input.status);
  if (input.search) params.set('search', input.search);
  if (input.paidOnly) params.set('paidOnly', 'true');
  params.set('page', String(Math.max(input.page, 1)));
  params.set('pageSize', String(input.pageSize));
  return `/orders?${params.toString()}`;
}
