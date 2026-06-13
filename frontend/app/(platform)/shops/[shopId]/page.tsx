import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';

export default async function ShopDetailPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Cửa hàng" title="Tổng quan cửa hàng" description={`Ngữ cảnh cửa hàng: ${shopId}`} />
      <SectionCard title="Cấu hình">
        <p className="text-sm text-zinc-600">Pancake, SePay, webhook và tax settings sẽ nằm trong settings tabs.</p>
      </SectionCard>
    </div>
  );
}
