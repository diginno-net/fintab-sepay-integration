import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { queryAll, createTestTenant, cleanupTenant } from './helpers.js';

describe('background job recovery semantics', () => {
  it('stale running jobs are claimable by the worker query', async () => {
    const tenant = await createTestTenant(`Job Recovery ${randomUUID().slice(0, 8)}`);
    const jobId = randomUUID();
    const workerId = `test-worker-${randomUUID().slice(0, 8)}`;

    try {
      await queryAll(
        `INSERT INTO background_jobs(id, tenant_id, type, status, payload_json, run_after, locked_at, locked_until, locked_by)
         VALUES ($1, $2, 'test:stale', 'running', '{}', now() - interval '10 minutes', now() - interval '10 minutes', now() - interval '5 minutes', 'dead-worker')`,
        [jobId, tenant.id]
      );

      const rows = await queryAll<{ id: string; status: string; locked_by: string }>(
        `UPDATE background_jobs
         SET status = 'running', locked_at = now(), locked_until = now() + interval '5 minutes', locked_by = $1, updated_at = now()
         WHERE id = (
           SELECT id FROM background_jobs
           WHERE (
              (status = 'queued' AND run_after <= now())
              OR (status = 'running' AND locked_until <= now())
            )
             AND (locked_at IS NULL OR locked_until IS NULL OR locked_until <= now())
           ORDER BY run_after ASC LIMIT 1
           FOR UPDATE SKIP LOCKED
         )
         RETURNING id, status, locked_by`,
        [workerId]
      );

      expect(rows).toHaveLength(1);
      expect(rows[0]!.id).toBe(jobId);
      expect(rows[0]!.status).toBe('running');
      expect(rows[0]!.locked_by).toBe(workerId);
    } finally {
      await cleanupTenant(tenant.id);
    }
  });

  it('shutdown requeues worker-owned running jobs', async () => {
    const tenant = await createTestTenant(`Job Shutdown ${randomUUID().slice(0, 8)}`);
    const jobId = randomUUID();
    const workerId = `test-worker-${randomUUID().slice(0, 8)}`;

    try {
      await queryAll(
        `INSERT INTO background_jobs(id, tenant_id, type, status, payload_json, run_after, locked_at, locked_until, locked_by)
         VALUES ($1, $2, 'test:shutdown', 'running', '{}', now(), now(), now() + interval '5 minutes', $3)`,
        [jobId, tenant.id, workerId]
      );

      await queryAll(
        `UPDATE background_jobs
         SET status = 'queued', locked_at = NULL, locked_until = NULL, locked_by = NULL, updated_at = now()
         WHERE locked_by = $1 AND status = 'running'`,
        [workerId]
      );

      const rows = await queryAll<{ status: string; locked_by: string | null }>('SELECT status, locked_by FROM background_jobs WHERE id = $1', [jobId]);
      expect(rows[0]!.status).toBe('queued');
      expect(rows[0]!.locked_by).toBeNull();
    } finally {
      await cleanupTenant(tenant.id);
    }
  });
});
