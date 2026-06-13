import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import Link from 'next/link';

export default async function ShopSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const tabs = [
    ['Pancake', `/shops/${shopId}/settings/pancake`],
    ['SePay', `/shops/${shopId}/settings/sepay`],
    ['Tax', `/shops/${shopId}/settings/tax`],
    ['Webhook', `/shops/${shopId}/settings/webhook`],
    ['Rules', `/shops/${shopId}/settings/rules`]
  ];
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Cài đặt cửa hàng" title="Trung tâm cài đặt" description="Điều hướng cấu hình Pancake, SePay, webhook, thuế và quy tắc hóa đơn." />
      <SectionCard title="Nhóm cài đặt">
        <div className="grid gap-3 md:grid-cols-3">
          {tabs.map(([label, href]) => <Link key={href} href={href} className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold transition hover:border-emerald-300">{label}</Link>)}
        </div>
      </SectionCard>
    </div>
  );
}
