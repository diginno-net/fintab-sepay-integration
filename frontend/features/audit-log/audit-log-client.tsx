'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/forms/button';
import { AuditLogEntry } from './types';
import { AuditLogTable } from './audit-log-table';
import { apiFetch } from '@/lib/api/client';

type RawAuditLogEntry = Partial<AuditLogEntry> & {
  tenant_shop_id?: string | null;
  actor_user_id?: string | null;
  resource_type?: string;
  metadata_json?: Record<string, unknown> | null;
};

export function AuditLogClient({ initialLogs }: { initialLogs: AuditLogEntry[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [filter, setFilter] = useState({ actorType: '', action: '', resource: '', shopId: '', fromDate: '', toDate: '' });
  const [isPending, startTransition] = useTransition();

  function applyFilter(key: string, value: string) {
    const next = { ...filter, [key]: value };
    setFilter(next);
    startTransition(() => {
      const params = new URLSearchParams();
      if (next.actorType) params.set('actorType', next.actorType);
      if (next.action) params.set('action', next.action);
      if (next.resource) params.set('resource', next.resource);
      if (next.shopId) params.set('shopId', next.shopId);
      if (next.fromDate) params.set('fromDate', new Date(next.fromDate).toISOString());
      if (next.toDate) params.set('toDate', new Date(next.toDate).toISOString());
      const suffix = params.toString() ? `?${params}` : '';
      apiFetch<RawAuditLogEntry[]>(`/v1/audit-logs${suffix}`, { cache: 'no-store' })
        .then(rows => setLogs(rows.map(normalizeAuditLogEntry)))
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
          <option value="">Tất cả loại tác nhân</option>
          <option value="user">Người dùng</option>
          <option value="worker">Worker</option>
          <option value="webhook">Webhook</option>
          <option value="system">Hệ thống</option>
        </select>
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm"
          placeholder="Lọc theo thao tác"
          value={filter.action}
          onChange={e => applyFilter('action', e.target.value)}
        />
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm"
          placeholder="Lọc theo tài nguyên"
          value={filter.resource}
          onChange={e => applyFilter('resource', e.target.value)}
        />
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm"
          placeholder="Shop ID"
          value={filter.shopId}
          onChange={e => applyFilter('shopId', e.target.value)}
        />
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm"
          type="datetime-local"
          value={filter.fromDate}
          onChange={e => applyFilter('fromDate', e.target.value)}
          aria-label="Từ ngày"
        />
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm"
          type="datetime-local"
          value={filter.toDate}
          onChange={e => applyFilter('toDate', e.target.value)}
          aria-label="Đến ngày"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => {
            setFilter({ actorType: '', action: '', resource: '', shopId: '', fromDate: '', toDate: '' });
            startTransition(() => {
              apiFetch<RawAuditLogEntry[]>('/v1/audit-logs', { cache: 'no-store' })
                .then(rows => setLogs(rows.map(normalizeAuditLogEntry)))
                .catch(() => undefined);
            });
          }}
        >
          Xóa lọc
        </Button>
      </div>
      <AuditLogTable logs={logs} />
    </div>
  );
}

function normalizeAuditLogEntry(row: RawAuditLogEntry): AuditLogEntry {
  return {
    id: row.id ?? '',
    tenant_id: row.tenant_id ?? '',
    shop_id: row.shop_id ?? row.tenant_shop_id ?? null,
    actor: row.actor ?? row.actor_user_id ?? row.actor_type ?? 'system',
    actor_type: row.actor_type ?? 'system',
    action: row.action ?? '',
    resource: row.resource ?? row.resource_type ?? '',
    resource_id: row.resource_id ?? null,
    diff: row.diff ?? row.metadata_json ?? null,
    ip_address: row.ip_address ?? null,
    correlation_id: row.correlation_id ?? null,
    created_at: row.created_at ?? new Date(0).toISOString()
  };
}
