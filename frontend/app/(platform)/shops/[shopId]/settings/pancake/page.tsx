import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { PancakeConfigForm } from '@/features/pancake-config/pancake-config-form';
import { getPancakeConfig } from '@/features/shops/api';

export default async function PancakeSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const config = await getPancakeConfig(shopId);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Pancake" title="Cấu hình Pancake" description="API key, shop ID và webhook secret theo cửa hàng." />
      <SectionCard title="Thông tin kết nối"><PancakeConfigForm shopId={shopId} config={config} /></SectionCard>
    </div>
  );
}
