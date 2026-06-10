'use client';

import { apiFetch } from '@/lib/api/client';

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

export async function listJobsClient(filters: { limit?: number; shopId?: string; status?: string; type?: string } = {}): Promise<JobEntry[]> {
  const params = new URLSearchParams();
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.shopId) params.set('shopId', filters.shopId);
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  const suffix = params.toString() ? `?${params}` : '';
  return apiFetch<JobEntry[]>(`/v1/jobs${suffix}`, { cache: 'no-store' });
}

export async function getJobClient(jobId: string): Promise<JobEntry> {
  return apiFetch<JobEntry>(`/v1/jobs/${jobId}`, { cache: 'no-store' });
}
