import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { getCurrentSession } from '@/features/auth/session';
import { InvoicePreviewForm } from '@/features/invoice-preview/invoice-preview-form';

export default async function InvoicePreviewPage({ searchParams }: { searchParams: Promise<{ shopId?: string; orderId?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const defaultShopId = params.shopId ?? session?.currentShopId ?? session?.shops[0]?.id ?? '';
  const defaultOrderId = params.orderId ?? '';
  return <div className="space-y-8"><PageHeader eyebrow="Xem trước" title="Xem trước hóa đơn" description="Kiểm tra người mua, dòng hàng, cách tính thuế và payload trước khi tạo nháp." /><SectionCard title="Form xem trước"><InvoicePreviewForm defaultShopId={defaultShopId} defaultOrderId={defaultOrderId} /></SectionCard></div>;
}
