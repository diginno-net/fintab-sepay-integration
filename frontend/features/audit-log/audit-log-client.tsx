'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/forms/button';
import { AuditLogEntry } from './types';
import { AuditLogTable } from './audit-log-table';
import { apiFetch } from '@/lib/api/client';

export function AuditLogClient({ initialLogs }: { initialLogs: AuditLogEntry[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [filter, setFilter] = useState({ actorType: '', action: '', resource: '' });
  const [isPending, startTransition] = useTransition();

  function applyFilter(key: string, value: string) {
    const next = { ...filter, [key]: value };
    setFilter(next);
    startTransition(() => {
      const params = new URLSearchParams();
      if (next.actorType) params.set('actorType', next.actorType);
      if (next.action) params.set('action', next.action);
      if (next.resource) params.set('resource', next.resource);
      const suffix = params.toString() ? `?${params}` : '';
      apiFetch<{ data: AuditLogEntry[] }>(`/v1/audit-logs${suffix}`, { cache: 'no-store' })
        .then(r => setLogs(r.data))
        .catch(() => undefined);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm"
          value={filter.actorType}
          onChange={e => applyFilter('actorType', e.target.value)}
        >
          <option value="">All actor types</option>
          <option value="user">User</option>
          <option value="worker">Worker</option>
          <option value="webhook">Webhook</option>
          <option value="system">System</option>
        </select>
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm"
          placeholder="Filter by action"
          value={filter.action}
          onChange={e => applyFilter('action', e.target.value)}
        />
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm"
          placeholder="Filter by resource"
          value={filter.resource}
          onChange={e => applyFilter('resource', e.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => {
            setFilter({ actorType: '', action: '', resource: '' });
            startTransition(() => {
              apiFetch<{ data: AuditLogEntry[] }>('/v1/audit-logs', { cache: 'no-store' })
                .then(r => setLogs(r.data))
                .catch(() => undefined);
            });
          }}
        >
          Clear
        </Button>
      </div>
      <AuditLogTable logs={logs} />
    </div>
  );
}
