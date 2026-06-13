import { randomUUID } from 'node:crypto';
import { query } from './shared/persistence/db.js';
import { env } from './config/env.js';
import { handleCreateDraft, handlePollCreate, handleIssue, handlePollIssue } from './modules/jobs/job-handlers.js';
import { updateInvoiceJobStatus } from './modules/invoices/invoice-job.service.js';
import { processPancakeOrderFullSyncJob } from './modules/pancake/pancake-order-sync.service.js';
import type { PancakeOrderFilterInput } from './modules/pancake/pancake-order-filter.js';
import { AppError } from './shared/http/errors.js';
import { humanizeSepayError, SepayError } from './modules/sepay/sepay.errors.js';
import { classifyJobError } from './shared/queue/job-error-classifier.js';
import { decideJobRetry } from './shared/queue/job-retry-policy.js';

const WORKER_ID = `worker-${randomUUID().slice(0, 8)}`;
const POLL_INTERVAL_MS = Number(env.JOBS_POLL_INTERVAL_MS) || 5000;

type BackgroundJob = {
  id: string;
  tenant_id: string;
  tenant_shop_id: string | null;
  invoice_job_id: string | null;
  type: string;
  status: string;
  attempts: number;
  max_attempts: number;
  payload_json: Record<string, unknown>;
  run_after: string;
};

async function pollAndProcessJobs() {
  const rows = await query<BackgroundJob>(
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
     RETURNING *`,
    [WORKER_ID]
  );

  for (const job of rows) {
    await processJob(job).catch(err => {
      console.error(`[worker:${WORKER_ID}] job ${job.id} (${job.type}) failed:`, err);
    });
  }
}

async function processJob(job: BackgroundJob) {
  console.log(`[worker:${WORKER_ID}] processing job ${job.id} type=${job.type} tenant=${job.tenant_id} attempt=${job.attempts + 1}/${job.max_attempts} invoiceJobId=${job.invoice_job_id}`);
  const tenantId = job.tenant_id;

  try {
    if (job.type === 'invoice:create-draft' || job.type === 'create_draft') {
      await handleCreateDraft(tenantId, job.invoice_job_id!);
      await updateJobStatus(job.id, 'succeeded');
    } else if (job.type === 'invoice:poll-create' || job.type === 'poll_create') {
      await handlePollCreate(tenantId, job.invoice_job_id!);
      await updateJobStatus(job.id, 'succeeded');
    } else if (job.type === 'invoice:issue' || job.type === 'issue') {
      await handleIssue(tenantId, job.invoice_job_id!);
      await updateJobStatus(job.id, 'succeeded');
    } else if (job.type === 'invoice:poll-issue' || job.type === 'poll_issue') {
      await handlePollIssue(tenantId, job.invoice_job_id!);
      await updateJobStatus(job.id, 'succeeded');
    } else if (job.type === 'pancake:orders-full-sync') {
      await processPancakeOrderFullSyncJob({
        tenantId,
        shopId: job.tenant_shop_id!,
        syncRunId: String(job.payload_json.syncRunId),
        pageSize: typeof job.payload_json.pageSize === 'number' ? job.payload_json.pageSize : undefined,
        filters: typeof job.payload_json.filters === 'object' && job.payload_json.filters !== null ? job.payload_json.filters as PancakeOrderFilterInput : undefined
      });
      await updateJobStatus(job.id, 'succeeded');
    } else {
      console.warn(`[worker:${WORKER_ID}] unknown job type: ${job.type}`);
      await updateJobStatus(job.id, 'failed');
    }
  } catch (err) {
    const serializedError = serializeJobError(err, job.id);
    const attempts = job.attempts + 1;
    const classification = classifyJobError(err);
    const decision = classification === 'transient'
      ? decideJobRetry({ attempts, maxAttempts: job.max_attempts })
      : { shouldRetry: false, nextRunAt: null };
    if (decision.shouldRetry) {
      await query(
        `UPDATE background_jobs
         SET attempts = $2,
             status = 'queued',
             run_after = $3,
             last_error_json = $4,
             locked_at = NULL,
             locked_until = NULL,
             locked_by = NULL,
             updated_at = now()
         WHERE id = $1`,
        [job.id, attempts, decision.nextRunAt, JSON.stringify(serializedError)]
      );
      console.warn(`[worker:${WORKER_ID}] job ${job.id} retry scheduled classification=${classification} attempt=${attempts}/${job.max_attempts} runAfter=${decision.nextRunAt?.toISOString()}`);
      return;
    }

    await query(
      `UPDATE background_jobs
       SET attempts = $2,
           status = 'failed',
           last_error_json = $3,
           locked_at = NULL,
           locked_until = NULL,
           locked_by = NULL,
           dead_lettered_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [job.id, attempts, JSON.stringify(serializedError)]
    );
    console.error(`[worker:${WORKER_ID}] job ${job.id} dead-lettered classification=${classification} attempt=${attempts}/${job.max_attempts}`);
    if (job.invoice_job_id) {
      try {
        await updateInvoiceJobStatus(job.tenant_id, job.invoice_job_id, {
          status: 'failed',
          errorJson: serializedError
        });
      } catch (invoiceErr) {
        console.error(`[worker:${WORKER_ID}] failed to update invoice job ${job.invoice_job_id}:`, invoiceErr);
      }
    }
    throw err;
  }
}

function serializeJobError(error: unknown, jobId: string): Record<string, unknown> {
  if (error instanceof AppError) {
    const details = typeof error.details === 'object' && error.details !== null ? error.details as Record<string, unknown> : {};
    return {
      jobId,
      name: error.name,
      code: typeof details.code === 'string' ? details.code : error.code,
      message: error.message,
      statusCode: error.statusCode,
      details
    };
  }
  if (error instanceof SepayError) {
    return {
      jobId,
      name: error.name,
      code: error.code,
      message: humanizeSepayError(error),
      statusCode: error.statusCode,
      details: error.details
    };
  }
  if (error instanceof Error) {
    return { jobId, name: error.name, message: error.message };
  }
  return { jobId, message: String(error) };
}

async function updateJobStatus(jobId: string, status: string) {
  await query(
    `UPDATE background_jobs
     SET status = $2,
         locked_at = NULL,
         locked_until = NULL,
         locked_by = NULL,
         completed_at = CASE WHEN $2 IN ('succeeded', 'failed', 'cancelled', 'timeout') THEN now() ELSE completed_at END,
         updated_at = now()
     WHERE id = $1`,
    [jobId, status]
  );
  console.log(`[worker:${WORKER_ID}] job ${jobId} status=${status}`);
}

async function start() {
  console.log(`[worker:${WORKER_ID}] starting, polling every ${POLL_INTERVAL_MS}ms`);
  console.log(`[worker:${WORKER_ID}] database: ${env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);

  const interval = setInterval(pollAndProcessJobs, POLL_INTERVAL_MS);
  await pollAndProcessJobs();

  async function shutdown() {
    console.log(`[worker:${WORKER_ID}] shutting down...`);
    clearInterval(interval);
    await query(
      `UPDATE background_jobs
       SET status = 'queued', locked_at = NULL, locked_until = NULL, locked_by = NULL, updated_at = now()
       WHERE locked_by = $1 AND status = 'running'`,
      [WORKER_ID]
    );
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(err => {
  console.error(`[worker:${WORKER_ID}] startup failed:`, err);
  process.exit(1);
});
