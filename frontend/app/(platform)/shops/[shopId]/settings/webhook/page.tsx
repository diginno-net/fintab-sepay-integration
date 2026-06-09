import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';

export default function WebhookSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Webhook" title="Pancake webhook" description="Cấu hình webhook URL và automation policy theo shop." />
      <SectionCard><p className="text-sm text-zinc-600">Webhook form sẽ được nối API ở FE-102.</p></SectionCard>
    </div>
  );
}
