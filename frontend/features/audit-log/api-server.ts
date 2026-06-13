import { cookies } from 'next/headers';
import { apiFetchWithCookie } from '@/lib/api/client';
import type { AuditLogEntry } from './types';

async function cookieHeader() {
  return (await cookies()).toString();
}

export async function listAuditLogs(filters: { limit?: number; shopId?: string; fromDate?: string; toDate?: string } = {}): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams();
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.shopId) params.set('shopId', filters.shopId);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  const suffix = params.toString() ? `?${params}` : '';
  const rows = await apiFetchWithCookie<RawAuditLogEntry[]>(`/v1/audit-logs${suffix}`, await cookieHeader(), { cache: 'no-store' });
  return rows.map(normalizeAuditLogEntry);
}

type RawAuditLogEntry = Partial<AuditLogEntry> & {
  tenant_shop_id?: string | null;
  actor_user_id?: string | null;
  resource_type?: string;
  metadata_json?: Record<string, unknown> | null;
  permission?: string | null;
};

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
