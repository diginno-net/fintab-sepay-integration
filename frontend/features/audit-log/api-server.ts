import { cookies } from 'next/headers';
import { apiFetchWithCookie } from '@/lib/api/client';
import type { AuditLogEntry } from './types';

async function cookieHeader() {
  return (await cookies()).toString();
}

export async function listAuditLogs(filters: { limit?: number } = {}): Promise<{ data: AuditLogEntry[] }> {
  const params = new URLSearchParams();
  if (filters.limit) params.set('limit', String(filters.limit));
  const suffix = params.toString() ? `?${params}` : '';
  return apiFetchWithCookie<{ data: AuditLogEntry[] }>(`/v1/audit-logs${suffix}`, await cookieHeader(), { cache: 'no-store' });
}
