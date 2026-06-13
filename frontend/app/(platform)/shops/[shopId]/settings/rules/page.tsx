import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';

export default function RulesSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Quy tắc" title="Quy tắc hóa đơn" description="Quy tắc trạng thái đơn, tạo nháp, phát hành và mapping dòng hàng." />
      <SectionCard><p className="text-sm text-zinc-600">Rule editor sẽ được triển khai sau.</p></SectionCard>
    </div>
  );
}
