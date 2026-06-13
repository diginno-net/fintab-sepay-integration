import { randomUUID } from 'node:crypto';
import { query } from '../persistence/db.js';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'timeout' | 'cancelled';

export type EnqueueJobInput = {
  tenantId: string;
  tenantShopId?: string | null;
  invoiceJobId?: string | null;
  type: string;
  payload?: Record<string, unknown>;
  runAfter?: Date;
  maxAttempts?: number;
  dedupeKey?: string | null;
};

export type BackgroundJob = {
  id: string;
  tenant_id: string;
  tenant_shop_id: string | null;
  invoice_job_id: string | null;
  type: string;
  status: JobStatus;
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

export async function enqueueJob(input: EnqueueJobInput): Promise<BackgroundJob> {
  const id = randomUUID();
  const rows = await query<BackgroundJob>(
    `INSERT INTO background_jobs(
       id, tenant_id, tenant_shop_id, invoice_job_id, type, payload_json, run_after, max_attempts, dedupe_key
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      input.tenantId,
      input.tenantShopId ?? null,
      input.invoiceJobId ?? null,
      input.type,
      input.payload ?? {},
      input.runAfter ?? new Date(),
      input.maxAttempts ?? 3,
      input.dedupeKey ?? null
    ]
  );
  return rows[0]!;
}

export async function getJobForTenant(tenantId: string, jobId: string): Promise<BackgroundJob | null> {
  const rows = await query<BackgroundJob>('SELECT * FROM background_jobs WHERE tenant_id = $1 AND id = $2 LIMIT 1', [tenantId, jobId]);
  return rows[0] ?? null;
}

export type ListJobsFilters = {
  limit?: number;
  shopId?: string;
  shopIds?: string[];
  type?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
};

export async function listJobsForTenant(tenantId: string, filters: ListJobsFilters = {}): Promise<BackgroundJob[]> {
  const { limit = 50, shopId, shopIds, type, status, fromDate, toDate } = filters;
  const conditions: string[] = ['tenant_id = $1'];
  const params: unknown[] = [tenantId];
  let i = 2;
  if (shopId) { conditions.push(`tenant_shop_id = $${i++}`); params.push(shopId); }
  if (!shopId && shopIds) {
    conditions.push(`(tenant_shop_id = ANY($${i++}::uuid[]) OR tenant_shop_id IS NULL)`);
    params.push(shopIds);
  }
  if (type) { conditions.push(`type = $${i++}`); params.push(type); }
  if (status) { conditions.push(`status = $${i++}`); params.push(status); }
  if (fromDate) { conditions.push(`created_at >= $${i++}`); params.push(fromDate); }
  if (toDate) { conditions.push(`created_at <= $${i++}`); params.push(toDate); }
  params.push(limit);
  return query<BackgroundJob>(`SELECT * FROM background_jobs WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${i}`, params);
}

export async function markJobForRetry(tenantId: string, jobId: string): Promise<BackgroundJob | null> {
  const rows = await query<BackgroundJob>(
    `UPDATE background_jobs
      SET status = 'queued', attempts = 0, run_after = now(), locked_at = NULL, locked_until = NULL, locked_by = NULL, dead_lettered_at = NULL, updated_at = now()
      WHERE tenant_id = $1 AND id = $2 AND status IN ('failed', 'timeout')
      RETURNING *`,
    [tenantId, jobId]
  );
  return rows[0] ?? null;
}
