import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { SepayConfigForm } from '@/features/sepay-config/sepay-config-form';
import { getSepayConfig } from '@/features/shops/api';

export default async function SepaySettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const config = await getSepayConfig(shopId);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="SePay" title="SePay config" description="Client credentials, provider account, template và series riêng cho shop." />
      {!config ? <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Shop này chưa cấu hình SePay. Không thể issue production invoice trước khi hoàn tất.</div> : null}
      <SectionCard title="SePay account"><SepayConfigForm shopId={shopId} config={config} /></SectionCard>
    </div>
  );
}
