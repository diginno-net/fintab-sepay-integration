import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { can, getCurrentSession } from '@/features/auth/session';
import { ShopAccessTable } from '@/features/shop-access/shop-access-table';
import { resolveCurrentShopId } from '@/features/shop-switcher/shop-context';

export default async function ShopAccessPage({ searchParams }: { searchParams: Promise<{ shopId?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  resolveCurrentShopId({ urlShopId: params.shopId, session });
  const allowed = can(session, 'shop_access:read');

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Cài đặt" title="Phân quyền cửa hàng" description="Gán tài khoản vào đúng cửa hàng và cấp quyền vận hành phù hợp." />
      <SectionCard title="Quyền truy cập theo cửa hàng">
        {allowed ? <ShopAccessTable shops={session?.shops ?? []} /> : <p className="text-sm text-zinc-600">Bạn không có quyền xem phân quyền cửa hàng.</p>}
      </SectionCard>
    </div>
  );
}
