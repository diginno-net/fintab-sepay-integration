import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { getCurrentSession } from '@/features/auth/session';
import { getOrder } from '@/features/orders/api';
import { getPancakePaymentStatus } from '@/features/orders/order-field-utils';
import { OrderDetailPageClient } from './order-detail-page-client';
import Link from 'next/link';
import { withShopId } from '@/features/shop-switcher/shop-context';

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ shopId?: string }> }) {
  const { orderId } = await params;
  const { shopId } = await searchParams;
  const session = await getCurrentSession();
  const effectiveShopId = shopId ?? session?.currentShopId ?? session?.shops[0]?.id;

  if (!effectiveShopId) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Pancake" title="Chi tiết đơn hàng" description="Không xác định được cửa hàng." />
        <SectionCard title="Lỗi">
          <p className="text-sm text-zinc-600">Vui lòng chọn shop trước.</p>
          <Link href={withShopId('/orders', effectiveShopId ?? null)} className="mt-3 inline-block text-sm font-semibold text-emerald-800">Quay lại đơn hàng</Link>
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
        <PageHeader eyebrow="Pancake" title="Chi tiết đơn hàng" description={`Đơn #${orderId}`} />
        <SectionCard title="Lỗi">
          <p className="text-sm text-zinc-600">Không tìm thấy đơn hàng hoặc shop chưa cấu hình Pancake.</p>
          <Link href={withShopId('/orders', effectiveShopId)} className="mt-3 inline-block text-sm font-semibold text-emerald-800">Quay lại đơn hàng</Link>
        </SectionCard>
      </div>
    );
  }

  const payment = getPancakePaymentStatus(order as Record<string, unknown>);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pancake"
        title={`Đơn #${orderId}`}
        description={order && typeof order === 'object' ? (order as Record<string, unknown>).status_name as string ?? 'unknown' : 'unknown'}
      >
        {payment.canCreateInvoice ? (
          <Link href={`/invoices/preview?shopId=${effectiveShopId}&orderId=${orderId}`} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">
            Tạo nháp
          </Link>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            Không thể tạo hóa đơn: {payment.reason}
          </div>
        )}
      </PageHeader>
      <OrderDetailPageClient order={order as Record<string, unknown>} shopId={effectiveShopId} orderId={orderId} />
    </div>
  );
}
