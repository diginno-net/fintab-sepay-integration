import { EmptyState } from '@/components/empty-states/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { Badge } from '@/components/status/badge';
import { getCurrentSession } from '@/features/auth/session';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const shops = session?.shops ?? [];
  const configuredSepay = shops.filter(shop => shop.hasSepayConfig).length;
  const configuredPancake = shops.filter(shop => shop.hasPancakeConfig).length;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Overview" title="Dashboard" description="Theo dõi cấu hình shop, job hóa đơn và trạng thái mapping thuế." />
      {shops.length === 0 ? <EmptyState title="Chưa có cửa hàng nào" description="Tạo shop đầu tiên để cấu hình Pancake, SePay và tax mapping." actionHref="/shops" actionLabel="Thêm cửa hàng" /> : null}
      <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Luồng chính">
          <div className="grid gap-3 text-sm text-zinc-600">
            <p>Pancake order được chuẩn hóa qua product catalog và tax profile trước khi tạo hóa đơn SePay.</p>
            <p>Các job create draft và issue chạy qua backend job queue để tránh blocking request.</p>
          </div>
        </SectionCard>
        <SectionCard title="Configuration status">
          <div className="grid gap-4">
            <div className="flex items-center justify-between"><span className="text-sm text-zinc-600">Total shops</span><strong>{shops.length}</strong></div>
            <div className="flex items-center justify-between"><span className="text-sm text-zinc-600">Pancake configured</span><Badge tone={configuredPancake === shops.length ? 'success' : 'warning'}>{configuredPancake}/{shops.length}</Badge></div>
            <div className="flex items-center justify-between"><span className="text-sm text-zinc-600">SePay configured</span><Badge tone={configuredSepay === shops.length ? 'success' : 'warning'}>{configuredSepay}/{shops.length}</Badge></div>
          </div>
        </SectionCard>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shops.map(shop => (
          <Link key={shop.id} href={`/shops/${shop.id}/settings`} className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-semibold text-zinc-950">{shop.name}</h2><p className="mt-1 text-sm text-zinc-500">{shop.status}</p></div>
              <div className="flex gap-2"><Badge tone={shop.hasPancakeConfig ? 'success' : 'warning'}>Pancake</Badge><Badge tone={shop.hasSepayConfig ? 'success' : 'warning'}>SePay</Badge></div>
            </div>
            {!shop.hasSepayConfig ? <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Chưa cấu hình SePay. Vào settings để hoàn tất trước khi phát hành.</p> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
