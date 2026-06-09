import { randomUUID } from 'node:crypto';
import { query } from './shared/persistence/db.js';
import { env } from './config/env.js';
import { handleCreateDraft, handlePollCreate, handleIssue, handlePollIssue } from './modules/jobs/job-handlers.js';
import { updateInvoiceJobStatus } from './modules/invoices/invoice-job.service.js';

const WORKER_ID = `worker-${randomUUID().slice(0, 8)}`;
const POLL_INTERVAL_MS = Number(env.JOBS_POLL_INTERVAL_MS) || 5000;

type BackgroundJob = {
  id: string;
  tenant_id: string;
  tenant_shop_id: string | null;
  invoice_job_id: string | null;
  type: string;
  status: string;
  payload_json: Record<string, unknown>;
  run_after: string;
};

async function pollAndProcessJobs() {
  const rows = await query<BackgroundJob>(
    `UPDATE background_jobs
     SET locked_at = now(), locked_by = $1, updated_at = now()
     WHERE id = (
       SELECT id FROM background_jobs
       WHERE status = 'queued' AND run_after <= now() AND locked_at IS NULL
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
  console.log(`[worker:${WORKER_ID}] processing job ${job.id} type=${job.type} invoiceJobId=${job.invoice_job_id}`);
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
    } else {
      console.warn(`[worker:${WORKER_ID}] unknown job type: ${job.type}`);
      await updateJobStatus(job.id, 'failed');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await query(
      `UPDATE background_jobs SET status = 'failed', last_error_json = $2, locked_at = NULL, locked_by = NULL, updated_at = now() WHERE id = $1`,
      [job.id, JSON.stringify({ message: errorMessage })]
    );
    if (job.invoice_job_id) {
      try {
        await updateInvoiceJobStatus(job.tenant_id, job.invoice_job_id, {
          status: 'failed',
          errorJson: { message: errorMessage, jobId: job.id }
        });
      } catch (invoiceErr) {
        console.error(`[worker:${WORKER_ID}] failed to update invoice job ${job.invoice_job_id}:`, invoiceErr);
      }
    }
    throw err;
  }
}

async function updateJobStatus(jobId: string, status: string) {
  await query(
    `UPDATE background_jobs SET status = $2, locked_at = NULL, locked_by = NULL, updated_at = now() WHERE id = $1`,
    [jobId, status]
  );
}

async function start() {
  console.log(`[worker:${WORKER_ID}] starting, polling every ${POLL_INTERVAL_MS}ms`);
  console.log(`[worker:${WORKER_ID}] database: ${env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);

  const interval = setInterval(pollAndProcessJobs, POLL_INTERVAL_MS);
  await pollAndProcessJobs();

  async function shutdown() {
    console.log(`[worker:${WORKER_ID}] shutting down...`);
    clearInterval(interval);
    await query(`UPDATE background_jobs SET locked_at = NULL, locked_by = NULL WHERE locked_by = $1 AND status = 'queued'`, [WORKER_ID]);
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(err => {
  console.error(`[worker:${WORKER_ID}] startup failed:`, err);
  process.exit(1);
});
