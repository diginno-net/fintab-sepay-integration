import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { getCurrentSession } from '@/features/auth/session';
import { InvoiceOpsClient } from '@/features/invoice-ops/invoice-ops-client';

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ shopId?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const shopId = params.shopId ?? session?.currentShopId ?? session?.shops[0]?.id;
  const currentShop = session?.shops.find(shop => shop.id === shopId) ?? session?.shops[0];

  if (!shopId) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Vận hành" title="Hóa đơn" description="Chưa xác định được shop để tải dữ liệu hóa đơn." />
        <SectionCard title="Chưa có shop">
          <p className="text-sm text-zinc-600">Vui lòng tạo hoặc chọn shop trước khi xử lý hóa đơn.</p>
        </SectionCard>
      </div>
    );
  }

  return <InvoiceOpsClient defaultShopId={shopId} shopName={currentShop?.name ?? null} />;
}
