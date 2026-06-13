import { createHash } from 'node:crypto';
import { AppError } from '../../shared/http/errors.js';
import { query } from '../../shared/persistence/db.js';
import { enqueueJob } from '../../shared/queue/job-queue.js';
import { assertShopBelongsToTenant } from '../tenant/tenant-shop.service.js';
import type { InvoiceType } from './invoice-mapper.js';
import { assertCanCreateDraft, assertCanIssue, assertCanRetry } from './invoice-state-machine.js';
import { getInvoiceBuyerRequest } from './invoice-buyer-request.service.js';
import { assertCompanyDraftMatchesRequest } from './invoice-request-rules.js';
import { assertSepayReadyForIssue, getSepayAutomationSettings } from '../sepay/sepay.service.js';
import { evaluateAutoIssue } from './invoice-automation-policy.js';

export type InvoiceJob = {
  id: string;
  tenant_id: string;
  tenant_shop_id: string;
  source: string;
  source_order_id: string;
  invoice_type: InvoiceType;
  status: string;
  sepay_create_tracking_code: string | null;
  sepay_issue_tracking_code: string | null;
  sepay_reference_code: string | null;
  invoice_number: string | null;
  request_payload_json: Record<string, unknown>;
  source_order_snapshot_json: Record<string, unknown>;
  mapping_warnings_json: unknown[];
  response_json: Record<string, unknown>;
  error_json: Record<string, unknown> | null;
  download_available: boolean | null;
  issued_at: string | null;
  pdf_url: string | null;
  xml_url: string | null;
  invoice_buyer_request_snapshot_json: Record<string, unknown>;
  invoice_request_hash: string | null;
  requires_draft_recreate: boolean | null;
  updated_at: string | null;
};

export async function findInvoiceJobByOrder(tenantId: string, shopId: string, sourceOrderId: string): Promise<InvoiceJob | null> {
  const rows = await query<InvoiceJob>(
    `SELECT * FROM invoice_jobs
     WHERE tenant_id = $1 AND tenant_shop_id = $2 AND source = 'pancake_pos' AND source_order_id = $3
     LIMIT 1`,
    [tenantId, shopId, sourceOrderId]
  );
  return rows[0] ?? null;
}

export async function listInvoiceJobsByOrders(tenantId: string, shopId: string, sourceOrderIds: string[]): Promise<InvoiceJob[]> {
  if (sourceOrderIds.length === 0) return [];
  return query<InvoiceJob>(
    `SELECT * FROM invoice_jobs
     WHERE tenant_id = $1 AND tenant_shop_id = $2 AND source = 'pancake_pos' AND source_order_id = ANY($3::text[])
     ORDER BY updated_at DESC`,
    [tenantId, shopId, sourceOrderIds]
  );
}

export async function getInvoiceJob(tenantId: string, invoiceJobId: string): Promise<InvoiceJob> {
  const rows = await query<InvoiceJob>('SELECT * FROM invoice_jobs WHERE tenant_id = $1 AND id = $2 LIMIT 1', [tenantId, invoiceJobId]);
  const job = rows[0];
  if (!job) throw new AppError('NOT_FOUND', 'Invoice job not found', 404);
  return job;
}

export async function listInvoiceJobs(tenantId: string, limit = 50, shopIds?: string[]): Promise<InvoiceJob[]> {
  if (shopIds) {
    return query<InvoiceJob>('SELECT * FROM invoice_jobs WHERE tenant_id = $1 AND tenant_shop_id = ANY($3::uuid[]) ORDER BY created_at DESC LIMIT $2', [tenantId, limit, shopIds]);
  }
  return query<InvoiceJob>('SELECT * FROM invoice_jobs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2', [tenantId, limit]);
}

export async function createOrReuseDraftJob(input: {
  tenantId: string;
  shopId: string;
  actorUserId?: string | null;
  sourceOrderId: string;
  invoiceType: InvoiceType;
  sourceOrderSnapshot: Record<string, unknown>;
  requestPayload: Record<string, unknown>;
  warnings: unknown[];
  invoiceBuyerRequestSnapshot?: Record<string, unknown> | null;
}): Promise<{ invoiceJob: InvoiceJob; backgroundJobId: string; reused: boolean }> {
  await assertShopBelongsToTenant(input.tenantId, input.shopId);
  const existing = await findInvoiceJobByOrder(input.tenantId, input.shopId, input.sourceOrderId);
  if (existing) {
    if (!(existing.status === 'draft_created' || existing.requires_draft_recreate)) {
      assertCanCreateDraft(existing.status);
    }
  }

  const idempotencyKey = createIdempotencyKey(input.tenantId, input.shopId, input.sourceOrderId);
  const snapshot = input.invoiceBuyerRequestSnapshot ?? null;
  const hash = snapshot ? computeInvoiceRequestHash(snapshot) : null;
  const rows = await query<InvoiceJob>(
    `INSERT INTO invoice_jobs(
       tenant_id, tenant_shop_id, source_order_id, invoice_type, idempotency_key,
       source_order_snapshot_json, request_payload_json, mapping_warnings_json,
       invoice_buyer_request_snapshot_json, invoice_request_hash, status, created_by
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10, 'draft_create_queued', $11)
      ON CONFLICT (tenant_id, tenant_shop_id, source, source_order_id)
      DO UPDATE SET status = 'draft_create_queued',
                    invoice_type = EXCLUDED.invoice_type,
                    request_payload_json = EXCLUDED.request_payload_json,
                    source_order_snapshot_json = EXCLUDED.source_order_snapshot_json,
                    mapping_warnings_json = EXCLUDED.mapping_warnings_json,
                    invoice_buyer_request_snapshot_json = EXCLUDED.invoice_buyer_request_snapshot_json,
                    invoice_request_hash = EXCLUDED.invoice_request_hash,
                    sepay_create_tracking_code = NULL,
                    sepay_issue_tracking_code = NULL,
                    sepay_reference_code = NULL,
                    invoice_number = NULL,
                    download_available = false,
                    issued_at = NULL,
                    response_json = '{}'::jsonb,
                    error_json = NULL,
                    updated_at = now()
     RETURNING *`,
    [
      input.tenantId,
      input.shopId,
      input.sourceOrderId,
      input.invoiceType,
      idempotencyKey,
      JSON.stringify(input.sourceOrderSnapshot),
      JSON.stringify(input.requestPayload),
      JSON.stringify(input.warnings),
      JSON.stringify(snapshot),
      hash,
      input.actorUserId ?? null
    ]
  );
  const invoiceJob = rows[0]!;
  const backgroundJob = await enqueueJob({
    tenantId: input.tenantId,
    tenantShopId: input.shopId,
    invoiceJobId: invoiceJob.id,
    type: 'create_draft',
    payload: { invoiceJobId: invoiceJob.id },
    dedupeKey: `create_draft:${invoiceJob.id}`
  });
  return { invoiceJob, backgroundJobId: backgroundJob.id, reused: Boolean(existing) };
}

export async function enqueueIssueJob(input: { tenantId: string; invoiceJobId: string; actorUserId: string | null }): Promise<{ invoiceJob: InvoiceJob; backgroundJobId: string }> {
  const job = await getInvoiceJob(input.tenantId, input.invoiceJobId);
  assertCanIssue(job.status);
  await assertSepayReadyForIssue(input.tenantId, job.tenant_shop_id);

  if (job.invoice_request_hash && job.invoice_buyer_request_snapshot_json) {
    const current = await getInvoiceBuyerRequest(input.tenantId, job.tenant_shop_id, job.source_order_id);
    if (current) {
      const currentHash = computeInvoiceRequestHash({
        buyerType: current.buyerType,
        taxCode: current.taxCode,
        legalName: current.legalName,
        buyerUnitName: current.buyerUnitName,
        invoiceAddress: current.invoiceAddress,
        identityNumber: current.identityNumber
      });
      if (currentHash !== job.invoice_request_hash) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Thông tin hóa đơn đã thay đổi sau khi tạo nháp. Vui lòng tạo lại nháp trước khi phát hành.',
          400,
          { requiresDraftRecreate: true }
        );
      }
      assertCompanyDraftMatchesRequest(current, job.request_payload_json);
    }
  }

  const rows = await query<InvoiceJob>(
    `UPDATE invoice_jobs SET status = 'issue_queued', issued_by = $3, updated_at = now()
     WHERE tenant_id = $1 AND id = $2
     RETURNING *`,
    [input.tenantId, input.invoiceJobId, input.actorUserId]
  );
  const invoiceJob = rows[0]!;
  const backgroundJob = await enqueueJob({
    tenantId: invoiceJob.tenant_id,
    tenantShopId: invoiceJob.tenant_shop_id,
    invoiceJobId: invoiceJob.id,
    type: 'issue',
    payload: { invoiceJobId: invoiceJob.id },
    dedupeKey: `issue:${invoiceJob.id}`
  });
  return { invoiceJob, backgroundJobId: backgroundJob.id };
}

export async function enqueueAutoIssueIfAllowed(input: { tenantId: string; invoiceJobId: string }): Promise<{ action: 'issue_enqueued'; invoiceJob: InvoiceJob; backgroundJobId: string } | { action: 'skipped'; reason?: string }> {
  const job = await getInvoiceJob(input.tenantId, input.invoiceJobId);
  const settings = await getSepayAutomationSettings(input.tenantId, job.tenant_shop_id);
  const request = await getInvoiceBuyerRequest(input.tenantId, job.tenant_shop_id, job.source_order_id);
  const decision = evaluateAutoIssue({
    settings,
    invoiceStatus: job.status,
    invoiceRequestConfirmed: request?.confirmed === true,
    alreadyIssued: job.status === 'issued',
    valid: Boolean(job.sepay_reference_code)
  });
  if (!decision.allowed) return { action: 'skipped', reason: decision.reason };
  const result = await enqueueIssueJob({ tenantId: input.tenantId, invoiceJobId: input.invoiceJobId, actorUserId: null });
  return { action: 'issue_enqueued', ...result };
}

export async function retryInvoiceJob(tenantId: string, invoiceJobId: string): Promise<{ invoiceJob: InvoiceJob; backgroundJobId: string }> {
  const job = await getInvoiceJob(tenantId, invoiceJobId);
  assertCanRetry(job.status);
  const type = job.sepay_reference_code ? 'issue' : 'create_draft';
  const status = type === 'issue' ? 'issue_queued' : 'draft_create_queued';
  const rows = await query<InvoiceJob>('UPDATE invoice_jobs SET status = $3, updated_at = now() WHERE tenant_id = $1 AND id = $2 RETURNING *', [tenantId, invoiceJobId, status]);
  const invoiceJob = rows[0]!;
  const backgroundJob = await enqueueJob({ tenantId, tenantShopId: invoiceJob.tenant_shop_id, invoiceJobId, type, payload: { invoiceJobId } });
  return { invoiceJob, backgroundJobId: backgroundJob.id };
}

export async function updateInvoiceJobStatus(tenantId: string, invoiceJobId: string, patch: Record<string, unknown>): Promise<InvoiceJob> {
  const rows = await query<InvoiceJob>(
    `UPDATE invoice_jobs
     SET status = COALESCE($3, status),
         sepay_create_tracking_code = COALESCE($4, sepay_create_tracking_code),
         sepay_issue_tracking_code = COALESCE($5, sepay_issue_tracking_code),
         sepay_reference_code = COALESCE($6, sepay_reference_code),
         invoice_number = COALESCE($7, invoice_number),
         response_json = response_json || $8::jsonb,
         error_json = $9,
         download_available = COALESCE($10, download_available),
         issued_at = COALESCE($11, issued_at),
         updated_at = now()
     WHERE tenant_id = $1 AND id = $2
     RETURNING *`,
    [
      tenantId,
      invoiceJobId,
      patch.status ?? null,
      patch.sepayCreateTrackingCode ?? null,
      patch.sepayIssueTrackingCode ?? null,
      patch.sepayReferenceCode ?? null,
      patch.invoiceNumber ?? null,
      patch.responseJson ?? {},
      patch.errorJson ?? null,
      patch.downloadAvailable ?? null,
      patch.issuedAt ?? null
    ]
  );
  return rows[0]!;
}

function createIdempotencyKey(tenantId: string, shopId: string, sourceOrderId: string): string {
  return createHash('sha256').update(`${tenantId}:${shopId}:pancake_pos:${sourceOrderId}`).digest('hex');
}

function computeInvoiceRequestHash(snapshot: Record<string, unknown>): string {
  const relevant = {
    buyerType: snapshot.buyerType ?? snapshot.buyer_type,
    taxCode: snapshot.taxCode ?? snapshot.tax_code,
    legalName: snapshot.legalName ?? snapshot.legal_name,
    buyerUnitName: snapshot.buyerUnitName ?? snapshot.buyer_unit_name,
    invoiceAddress: snapshot.invoiceAddress ?? snapshot.invoice_address,
    identityNumber: snapshot.identityNumber ?? snapshot.identity_number
  };
  return createHash('sha256').update(JSON.stringify(relevant)).digest('hex');
}

export function computeInvoiceRequestHashFromObject(snapshot: Record<string, unknown>): string {
  return computeInvoiceRequestHash(snapshot);
}

export async function checkDraftOutdated(tenantId: string, shopId: string, sourceOrderId: string): Promise<boolean> {
  const job = await findInvoiceJobByOrder(tenantId, shopId, sourceOrderId);
  if (!job || !job.invoice_request_hash || !job.invoice_buyer_request_snapshot_json) return false;
  const currentHash = computeInvoiceRequestHash(job.invoice_buyer_request_snapshot_json);
  return currentHash !== job.invoice_request_hash;
}

export async function markDraftRequiresRecreate(tenantId: string, invoiceJobId: string): Promise<void> {
  await query(
    'UPDATE invoice_jobs SET requires_draft_recreate = true, updated_at = now() WHERE tenant_id = $1 AND id = $2',
    [tenantId, invoiceJobId]
  );
}
