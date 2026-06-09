import { cookies } from 'next/headers';
import { apiFetchWithCookie } from '@/lib/api/client';
export { maskError } from '@/lib/mask-error';

async function cookieHeader() {
  return (await cookies()).toString();
}

export type JobEntry = {
  id: string;
  tenant_id: string;
  tenant_shop_id: string | null;
  invoice_job_id: string | null;
  type: string;
  status: string;
  attempts: number;
  max_attempts: number;
  poll_attempts: number;
  max_poll_attempts: number;
  payload_json: Record<string, unknown>;
  result_json: Record<string, unknown>;
  last_error_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export async function listJobs(filters: { limit?: number; shopId?: string; status?: string; type?: string } = {}): Promise<JobEntry[]> {
  const params = new URLSearchParams();
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.shopId) params.set('shopId', filters.shopId);
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  const suffix = params.toString() ? `?${params}` : '';
  return apiFetchWithCookie<JobEntry[]>(`/v1/jobs${suffix}`, await cookieHeader(), { cache: 'no-store' });
}

export async function getJob(jobId: string): Promise<JobEntry> {
  return apiFetchWithCookie<JobEntry>(`/v1/jobs/${jobId}`, await cookieHeader(), { cache: 'no-store' });
}


