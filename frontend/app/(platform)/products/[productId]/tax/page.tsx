import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { getProductTaxProfile } from '@/features/products/api';
import { ProductTaxProfileForm } from '@/features/tax-mapping/product-tax-profile-form';

export default async function ProductTaxPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const profile = await getProductTaxProfile(productId).catch(() => null);
  return <div className="space-y-8"><PageHeader eyebrow="Tax profile" title="Product tax" description="Cấu hình thuế suất, line type và đơn vị xuất hóa đơn." /><SectionCard title="Tax profile"><ProductTaxProfileForm productId={productId} profile={profile} /></SectionCard></div>;
}
