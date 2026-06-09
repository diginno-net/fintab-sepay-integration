import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { getTaxDefaults } from '@/features/shops/api';
import { TaxDefaultsForm } from '@/features/tax-mapping/tax-defaults-form';

export default async function TaxSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const defaults = await getTaxDefaults(shopId);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Tax" title="Tax defaults" description="VAT mặc định và policy sản phẩm chưa map thuế." />
      <SectionCard title="Default mapping"><TaxDefaultsForm shopId={shopId} defaults={defaults} /></SectionCard>
    </div>
  );
}
