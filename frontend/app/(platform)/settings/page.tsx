import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';

export default function SettingsPage() {
  return <div className="space-y-8"><PageHeader eyebrow="Account" title="Settings" description="Thiết lập tài khoản và tenant." /><SectionCard><p className="text-sm text-zinc-600">User settings sẽ được triển khai sau.</p></SectionCard></div>;
}
