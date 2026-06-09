import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';

export default function RulesSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Rules" title="Invoice rules" description="Quy tắc trạng thái đơn, draft, issue và mapping line items." />
      <SectionCard><p className="text-sm text-zinc-600">Rule editor sẽ được triển khai sau.</p></SectionCard>
    </div>
  );
}
