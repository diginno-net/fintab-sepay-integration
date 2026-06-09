import { cookies } from 'next/headers';
import { apiFetchWithCookie } from '@/lib/api/client';

async function cookieHeader() {
  return (await cookies()).toString();
}

export type AuditLogEntry = {
  id: string;
  tenant_id: string;
  shop_id: string | null;
  actor: string;
  actor_type: 'user' | 'worker' | 'webhook' | 'system';
  action: string;
  resource: string;
  resource_id: string | null;
  diff: Record<string, unknown> | null;
  ip_address: string | null;
  correlation_id: string | null;
  created_at: string;
};

export type AuditLogFilters = {
  actor?: string;
  actorType?: string;
  action?: string;
  shopId?: string;
  resource?: string;
  limit?: number;
};

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  const params = new URLSearchParams();
  if (filters.limit) params.set('limit', String(filters.limit));
  const suffix = params.toString() ? `?${params}` : '';
  return apiFetchWithCookie<{ data: AuditLogEntry[] }>(`/v1/audit-logs${suffix}`, await cookieHeader(), { cache: 'no-store' });
}

export function formatActorType(type: string): string {
  const map: Record<string, string> = { user: 'User', worker: 'Worker', webhook: 'Webhook', system: 'System' };
  return map[type] ?? type;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
