import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { getCurrentSession } from '@/features/auth/session';
import { InvoicePreviewForm } from '@/features/invoice-preview/invoice-preview-form';

export default async function InvoicePreviewPage({ searchParams }: { searchParams: Promise<{ shopId?: string; orderId?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const defaultShopId = params.shopId ?? session?.currentShopId ?? session?.shops[0]?.id ?? '';
  const defaultOrderId = params.orderId ?? '';
  return <div className="space-y-8"><PageHeader eyebrow="Preview" title="Invoice preview" description="Kiểm tra buyer, items, tax resolution và payload trước khi tạo draft." /><SectionCard title="Preview form"><InvoicePreviewForm defaultShopId={defaultShopId} defaultOrderId={defaultOrderId} /></SectionCard></div>;
}
