import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { Badge } from '@/components/status/badge';
import { getCurrentSession } from '@/features/auth/session';
import { extractOrderRows, listOrders, orderId, orderStatus, orderTotal, orderDate, orderCustomerName } from '@/features/orders/api';
import Link from 'next/link';

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ shopId?: string; status?: string; search?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const shopId = params.shopId ?? session?.currentShopId ?? session?.shops[0]?.id;
  const ordersPayload = shopId ? await listOrders(shopId, { status: params.status, search: params.search }).catch(() => null) : null;
  const orders = extractOrderRows(ordersPayload);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Pancake" title="Orders" description="Danh sách đơn hàng theo shop và trạng thái." />
      <SectionCard title="Filters">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm" name="shopId" defaultValue={shopId ?? ''} placeholder="Shop ID" />
          <input className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm" name="status" defaultValue={params.status ?? ''} placeholder="Status" />
          <input className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm" name="search" defaultValue={params.search ?? ''} placeholder="Search" />
          <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">Filter</button>
        </form>
      </SectionCard>
      <SectionCard title={`Order list (${orders.length})`}>
        {orders.length === 0 ? <p className="text-sm text-zinc-600">Chưa có dữ liệu hoặc shop chưa cấu hình Pancake.</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="py-3">Order</th>
                <th>Khách hàng</th>
                <th>Status</th>
                <th className="text-right">Tổng tiền</th>
                <th>Ngày</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map(order => (
                <tr key={orderId(order)}>
                  <td className="py-3 font-medium">{orderId(order)}</td>
                  <td className="py-3 text-zinc-600">{orderCustomerName(order)}</td>
                  <td className="py-3"><Badge>{orderStatus(order)}</Badge></td>
                  <td className="py-3 text-right font-medium">{orderTotal(order)}</td>
                  <td className="py-3 text-zinc-500">{orderDate(order)}</td>
                  <td className="py-3">
                    <div className="flex gap-3">
                      <Link className="font-semibold text-emerald-800" href={`/orders/${orderId(order)}?shopId=${shopId}`}>Chi tiết</Link>
                      <Link className="font-semibold text-emerald-700" href={`/invoices/preview?shopId=${shopId}&orderId=${orderId(order)}`}>Invoice</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
