import { EmptyState } from '@/components/empty-states/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { Badge } from '@/components/status/badge';
import { CreateShopForm } from '@/features/shop-management/create-shop-form';
import { listTenantShops } from '@/features/shops/api';
import Link from 'next/link';

export default async function ShopsPage() {
  const shops = await listTenantShops().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Cấu hình" title="Cửa hàng" description="Quản lý shop Pancake, cấu hình SePay và thuế mặc định theo từng cửa hàng." />
      <SectionCard title="Tạo shop mới"><CreateShopForm /></SectionCard>
      {shops.length === 0 ? <EmptyState title="Chưa có shop" description="Tạo shop đầu tiên để bắt đầu cấu hình Pancake, SePay và tax mapping." /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {shops.map(shop => (
          <Link key={shop.id} href={`/shops/${shop.id}/settings`} className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-semibold text-zinc-950">{shop.shop_name}</h2><p className="mt-1 text-sm text-zinc-500">Pancake shop ID: {shop.external_shop_id}</p></div>
              <Badge tone={shop.status === 'active' ? 'success' : 'neutral'}>{shop.status}</Badge>
            </div>
            <p className="mt-5 text-sm font-semibold text-emerald-800">Mở settings</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
