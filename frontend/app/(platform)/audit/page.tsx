import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { AuditLogClient } from '@/features/audit-log/audit-log-client';
import { listAuditLogs } from '@/features/audit-log/api-server';

export default async function AuditPage() {
  const logs = await listAuditLogs({ limit: 50 }).catch(() => ({ data: [] as never[] }));

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Audit" title="Audit logs" description="Lịch sử thao tác người dùng, worker và webhook." />
      <SectionCard title="Audit entries">
        <AuditLogClient initialLogs={logs.data} />
      </SectionCard>
    </div>
  );
}
