import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { getProductTaxProfile } from '@/features/products/api';
import { ProductTaxProfileForm } from '@/features/tax-mapping/product-tax-profile-form';
import { getCurrentSession } from '@/features/auth/session';

export default async function ProductTaxPage({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams: Promise<{ shopId?: string }> }) {
  const { productId } = await params;
  const query = await searchParams;
  const session = await getCurrentSession();
  const shopId = query.shopId ?? session?.currentShopId ?? session?.shops[0]?.id ?? null;
  const profile = await getProductTaxProfile(productId).catch(() => null);
  return <div className="space-y-8"><PageHeader eyebrow="Hồ sơ thuế" title="Thuế sản phẩm" description="Cấu hình thuế suất, loại dòng và đơn vị xuất hóa đơn." /><SectionCard title="Hồ sơ thuế"><ProductTaxProfileForm productId={productId} shopId={shopId} profile={profile} /></SectionCard></div>;
}
