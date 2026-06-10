import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { Badge } from '@/components/status/badge';
import { Button } from '@/components/forms/button';
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pancake"
        title="Quản lý đơn hàng"
        description="Danh sách đơn hàng từ Pancake POS"
      />

      <SectionCard title="Filters">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm" name="shopId" defaultValue={shopId ?? ''} placeholder="Shop ID" />
          <input className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm" name="status" defaultValue={params.status ?? ''} placeholder="Status" />
          <input className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm" name="search" defaultValue={params.search ?? ''} placeholder="Search" />
          <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">Lọc</button>
        </form>
      </SectionCard>

      <SectionCard title={`Danh sách đơn hàng (${orders.length})`} className="p-0">
        {orders.length === 0 ? (
          <div className="p-6 text-center text-sm text-zinc-600">
            Chưa có dữ liệu hoặc shop chưa cấu hình Pancake.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  <th className="py-3 px-4">Đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Tổng tiền</th>
                  <th className="py-3 px-4">Ngày</th>
                  <th className="py-3 px-4">Hóa đơn</th>
                  <th className="py-3 px-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map(order => (
                  <tr key={orderId(order)} className="hover:bg-zinc-50">
                    <td className="py-3 px-4 font-medium">#{orderId(order)}</td>
                    <td className="py-3 px-4 text-zinc-600">{orderCustomerName(order)}</td>
                    <td className="py-3 px-4"><Badge>{orderStatus(order)}</Badge></td>
                    <td className="py-3 px-4 text-right font-medium">{orderTotal(order)}</td>
                    <td className="py-3 px-4 text-zinc-500">{orderDate(order)}</td>
                    <td className="py-3 px-4">
                      <Badge tone="neutral">Chưa tạo</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link href={`/orders/${orderId(order)}?shopId=${shopId}`}>
                          <Button size="sm" variant="ghost">Chi tiết</Button>
                        </Link>
                        <Link href={`/invoices/preview?shopId=${shopId}&orderId=${orderId(order)}`}>
                          <Button size="sm" variant="secondary">Tạo HĐ</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
