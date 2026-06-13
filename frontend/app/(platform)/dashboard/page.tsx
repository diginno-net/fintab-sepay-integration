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
  const pipeline = ['Pancake order', 'Normalize product', 'Apply tax profile', 'Create draft', 'Issue invoice'];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Tổng quan" title="Tổng quan" description="Theo dõi cấu hình cửa hàng, tác vụ hóa đơn và trạng thái mapping thuế." />
      {shops.length === 0 ? <EmptyState title="Chưa có cửa hàng nào" description="Tạo shop đầu tiên để cấu hình Pancake, SePay và tax mapping." actionHref="/shops" actionLabel="Thêm cửa hàng" /> : null}
      <div className="grid gap-5 md:grid-cols-[1.35fr_0.65fr]">
        <SectionCard title="Luồng hóa đơn">
          <div className="grid gap-3 md:grid-cols-5">
            {pipeline.map((item, index) => (
              <div key={item} className="rounded-2xl border border-line bg-surface-muted/55 p-4">
                <p className="font-mono text-xs font-semibold text-accent">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-3 text-sm font-semibold leading-5 text-ink">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-muted">
            <p>Pancake order được chuẩn hóa qua product catalog và tax profile trước khi tạo hóa đơn SePay.</p>
            <p>Các job create draft và issue chạy qua backend job queue để tránh blocking request.</p>
          </div>
        </SectionCard>
        <SectionCard title="Trạng thái cấu hình">
          <div className="grid gap-4">
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Tổng cửa hàng</span><strong className="font-mono tabular-nums">{shops.length}</strong></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Đã cấu hình Pancake</span><Badge tone={configuredPancake === shops.length ? 'success' : 'warning'}>{configuredPancake}/{shops.length}</Badge></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Đã cấu hình SePay</span><Badge tone={configuredSepay === shops.length ? 'success' : 'warning'}>{configuredSepay}/{shops.length}</Badge></div>
          </div>
        </SectionCard>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shops.map(shop => (
          <Link key={shop.id} href={`/shops/${shop.id}/settings`} className="group rounded-[1.75rem] border border-line bg-surface p-5 shadow-warm-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent/35">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-semibold text-ink">{shop.name}</h2><p className="mt-1 font-mono text-sm text-muted">{shop.status}</p></div>
              <div className="flex gap-2"><Badge tone={shop.hasPancakeConfig ? 'success' : 'warning'}>Pancake</Badge><Badge tone={shop.hasSepayConfig ? 'success' : 'warning'}>SePay</Badge></div>
            </div>
            {!shop.hasSepayConfig ? <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Chưa cấu hình SePay. Vào settings để hoàn tất trước khi phát hành.</p> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
