import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { Badge } from '@/components/status/badge';
import { getCurrentSession } from '@/features/auth/session';
import { getOrder } from '@/features/orders/api';
import { OrderDetailClient } from '@/features/orders/order-detail-client';
import Link from 'next/link';

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ shopId?: string }> }) {
  const { orderId } = await params;
  const { shopId } = await searchParams;
  const session = await getCurrentSession();
  const effectiveShopId = shopId ?? session?.currentShopId ?? session?.shops[0]?.id;

  if (!effectiveShopId) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Pancake" title="Order Detail" description="Không xác định được shop." />
        <SectionCard title="Error">
          <p className="text-sm text-zinc-600">Vui lòng chọn shop trước.</p>
          <Link href="/orders" className="mt-3 inline-block text-sm font-semibold text-emerald-800">Quay lại Orders</Link>
        </SectionCard>
      </div>
    );
  }

  let order = null;
  try {
    order = await getOrder(effectiveShopId, orderId);
  } catch {
    order = null;
  }

  if (!order) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Pancake" title="Order Detail" description={`Đơn #${orderId}`} />
        <SectionCard title="Error">
          <p className="text-sm text-zinc-600">Không tìm thấy đơn hàng hoặc shop chưa cấu hình Pancake.</p>
          <Link href="/orders" className="mt-3 inline-block text-sm font-semibold text-emerald-800">Quay lại Orders</Link>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pancake"
        title={`Đơn #${orderId}`}
        description={order && typeof order === 'object' ? (order as Record<string, unknown>).status_name as string ?? 'unknown' : 'unknown'}
      >
        <Link href={`/invoices/preview?shopId=${effectiveShopId}&orderId=${orderId}`} className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white">
          Preview Invoice
        </Link>
      </PageHeader>
      <OrderDetailClient order={order as Record<string, unknown>} shopId={effectiveShopId} />
    </div>
  );
}
