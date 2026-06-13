import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { AppError } from '../../shared/http/errors.js';
import { validateBody, validateParams, validateQuery } from '../../shared/http/validate.js';
import { downloadInvoiceArtifact, handlePollCreate, handlePollIssue, handleRefresh } from '../jobs/job-handlers.js';
import { createOrReuseDraftJob, enqueueIssueJob, getInvoiceJob, listInvoiceJobs, retryInvoiceJob, findInvoiceJobByOrder, computeInvoiceRequestHashFromObject } from './invoice-job.service.js';
import { createInvoicePreview } from './invoice.service.js';
import { getInvoiceBuyerRequest, getInvoiceBuyerRequestOrSuggested, upsertInvoiceBuyerRequest } from './invoice-buyer-request.service.js';
import { invoiceBuyerRequestSchema, invoiceBuyerRequestParamsSchema } from './invoice-buyer-request.schema.js';
import { pancakeClientForShop } from '../pancake/pancake.service.js';
import { getSepayConfigForShop } from '../sepay/sepay.service.js';
import { accessibleShopIds, assertUserCanAccessShopForAction } from '../tenant/shop-access.service.js';
import { normalizeInvoiceRequestForProcessing } from './invoice-request-normalizers.js';
import { assertCompanyPayloadMatchesRequest, assertInvoiceRequestReadyForDraft, validateInvoiceRequest } from './invoice-request-rules.js';
import { listInvoiceOrderRows } from './invoice-order-read.service.js';
import { bulkCreateDraftForOrders, bulkIssueOrders, createDraftForOrder, issueOrderInvoice } from './invoice-workflow.service.js';
import { AUDIT_ACTIONS, tryWriteAuditLog } from '../audit/audit.service.js';

const previewBodySchema = z.object({
  shopId: z.string().uuid(),
  orderId: z.string().min(1),
  invoiceType: z.enum(['gtgt', 'ban_hang']).default('ban_hang')
});
const invoiceJobParamsSchema = z.object({ jobId: z.string().uuid() });
const downloadParamsSchema = z.object({ jobId: z.string().uuid(), type: z.enum(['pdf', 'xml']) });
const jobsQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), shopId: z.string().uuid().optional() });
const buyerRequestParamsSchema = z.object({ shopId: z.string().uuid(), orderId: z.string().min(1) });
const booleanQuerySchema = z.preprocess(value => value === 'true' || value === true, z.boolean());
const arrayQuerySchema = z.preprocess(value => Array.isArray(value) ? value : (value === undefined ? undefined : [value]), z.array(z.union([z.string(), z.number()])).optional());
const invoiceOrdersQuerySchema = z.object({
  shopId: z.string().uuid(),
  status: z.string().optional().default('all'),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(100),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  paidOnly: booleanQuerySchema.optional().default(false),
  pancakeStatus: z.string().optional(),
  filterStatus: arrayQuerySchema,
  completedOnly: booleanQuerySchema.optional().default(false),
  completedDays: z.coerce.number().int().positive().max(365).optional(),
  updateStatus: z.string().optional(),
  startDateTime: z.coerce.number().int().positive().optional(),
  endDateTime: z.coerce.number().int().positive().optional(),
  optionSort: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});
const invoiceOrderParamsSchema = z.object({ shopId: z.string().uuid(), orderId: z.string().min(1) });
const orderActionBodySchema = z.object({ invoiceType: z.enum(['gtgt', 'ban_hang']).optional().default('ban_hang') });
const bulkOrderActionBodySchema = z.object({
  shopId: z.string().uuid(),
  orderIds: z.array(z.string().min(1)).min(1).max(100),
  invoiceType: z.enum(['gtgt', 'ban_hang']).optional().default('ban_hang')
});
const bulkCreateByFilterBodySchema = z.object({
  shopId: z.string().uuid(),
  status: z.string().optional().default('all'),
  search: z.string().optional(),
  paidOnly: z.boolean().optional().default(false),
  pancakeStatus: z.string().optional(),
  filterStatus: z.array(z.union([z.string(), z.number()])).optional(),
  completedOnly: z.boolean().optional().default(false),
  completedDays: z.coerce.number().int().positive().max(365).optional(),
  updateStatus: z.string().optional(),
  startDateTime: z.coerce.number().int().positive().optional(),
  endDateTime: z.coerce.number().int().positive().optional(),
  optionSort: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  invoiceType: z.enum(['gtgt', 'ban_hang']).optional().default('ban_hang'),
  limit: z.coerce.number().int().min(1).max(500).default(500)
});

export async function registerInvoiceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/invoice-orders', { preHandler: requirePermission('invoice:read') }, async request => {
    const query = validateQuery(request, invoiceOrdersQuerySchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: query.shopId, action: 'invoice:read' });
    return {
      data: await listInvoiceOrderRows({
        tenantId: request.user!.tenantId,
        shopId: query.shopId,
        status: query.status,
        search: query.search,
        page: query.page,
        pageSize: query.limit ?? query.pageSize,
        paidOnly: query.paidOnly,
        pancakeStatus: query.pancakeStatus,
        filterStatus: query.filterStatus,
        completedOnly: query.completedOnly,
        completedDays: query.completedDays,
        updateStatus: query.updateStatus,
        startDateTime: query.startDateTime,
        endDateTime: query.endDateTime,
        optionSort: query.optionSort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo
      })
    };
  });

  app.post('/v1/invoice-orders/:shopId/:orderId/create-draft', { preHandler: requirePermission('invoice:create') }, async (request, reply) => {
    const params = validateParams(request, invoiceOrderParamsSchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: params.shopId, action: 'invoice:create' });
    const body = validateBody(request, orderActionBodySchema);
    const result = await createDraftForOrder({ tenantId: request.user!.tenantId, shopId: params.shopId, orderId: params.orderId, actorUserId: request.user!.id, invoiceType: body.invoiceType });
    await tryWriteAuditLog({
      tenantId: request.user!.tenantId,
      tenantShopId: params.shopId,
      actorUserId: request.user!.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.INVOICE_DRAFT_REQUESTED,
      resourceType: 'invoice_job',
      resourceId: result.invoiceJob.id,
      metadata: { orderId: params.orderId, source: 'invoice_orders' },
      correlationId: request.id
    });
    reply.status(202);
    return { data: result };
  });

  app.post('/v1/invoice-orders/:shopId/:orderId/issue', { preHandler: requirePermission('invoice:issue') }, async (request, reply) => {
    const params = validateParams(request, invoiceOrderParamsSchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: params.shopId, action: 'invoice:issue' });
    const result = await issueOrderInvoice({ tenantId: request.user!.tenantId, shopId: params.shopId, orderId: params.orderId, actorUserId: request.user!.id });
    await tryWriteAuditLog({
      tenantId: request.user!.tenantId,
      tenantShopId: params.shopId,
      actorUserId: request.user!.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.INVOICE_ISSUE_REQUESTED,
      resourceType: 'invoice_job',
      resourceId: result.invoiceJob.id,
      metadata: { orderId: params.orderId, source: 'invoice_orders' },
      correlationId: request.id
    });
    reply.status(202);
    return { data: result };
  });

  app.post('/v1/invoice-orders/bulk-create-draft', { preHandler: requirePermission('invoice:create') }, async (request, reply) => {
    const body = validateBody(request, bulkOrderActionBodySchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: body.shopId, action: 'invoice:create' });
    const result = await bulkCreateDraftForOrders({ tenantId: request.user!.tenantId, shopId: body.shopId, orderIds: body.orderIds, actorUserId: request.user!.id, invoiceType: body.invoiceType });
    await tryWriteAuditLog({
      tenantId: request.user!.tenantId,
      tenantShopId: body.shopId,
      actorUserId: request.user!.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.INVOICE_DRAFT_REQUESTED,
      resourceType: 'invoice_job',
      metadata: { orderCount: body.orderIds.length, source: 'bulk' },
      correlationId: request.id
    });
    reply.status(202);
    return { data: result };
  });

  app.post('/v1/invoice-orders/bulk-create-draft-by-filter', { preHandler: requirePermission('invoice:create') }, async (request, reply) => {
    const body = validateBody(request, bulkCreateByFilterBodySchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: body.shopId, action: 'invoice:create' });
    const orderIds: string[] = [];
    let page = 1;
    let totalMatched = 0;
    do {
      const pageResult = await listInvoiceOrderRows({
        tenantId: request.user!.tenantId,
        shopId: body.shopId,
        status: body.status,
        search: body.search,
        page,
        pageSize: 100,
        paidOnly: body.paidOnly,
        pancakeStatus: body.pancakeStatus,
        filterStatus: body.filterStatus,
        completedOnly: body.completedOnly,
        completedDays: body.completedDays,
        updateStatus: body.updateStatus,
        startDateTime: body.startDateTime,
        endDateTime: body.endDateTime,
        optionSort: body.optionSort,
        dateFrom: body.dateFrom,
        dateTo: body.dateTo
      });
      totalMatched = pageResult.pagination.totalEntries;
      for (const row of pageResult.rows) {
        if (row.eligibleForDraft && !orderIds.includes(row.orderId)) orderIds.push(row.orderId);
        if (orderIds.length >= body.limit) break;
      }
      if (orderIds.length >= body.limit || !pageResult.pagination.hasNextPage) break;
      page += 1;
    } while (page <= 50);

    const result = orderIds.length > 0
      ? await bulkCreateDraftForOrders({ tenantId: request.user!.tenantId, shopId: body.shopId, orderIds, actorUserId: request.user!.id, invoiceType: body.invoiceType })
      : { results: [] };
    reply.status(202);
    return { data: { totalMatched, attempted: orderIds.length, created: result.results.filter(item => item.ok).length, skipped: result.results.filter(item => !item.ok).length, results: result.results } };
  });

  app.post('/v1/invoice-orders/bulk-issue', { preHandler: requirePermission('invoice:issue') }, async (request, reply) => {
    const body = validateBody(request, bulkOrderActionBodySchema.omit({ invoiceType: true }));
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: body.shopId, action: 'invoice:issue' });
    const result = await bulkIssueOrders({ tenantId: request.user!.tenantId, shopId: body.shopId, orderIds: body.orderIds, actorUserId: request.user!.id });
    await tryWriteAuditLog({
      tenantId: request.user!.tenantId,
      tenantShopId: body.shopId,
      actorUserId: request.user!.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.INVOICE_ISSUE_REQUESTED,
      resourceType: 'invoice_job',
      metadata: { orderCount: body.orderIds.length, source: 'bulk' },
      correlationId: request.id
    });
    reply.status(202);
    return { data: result };
  });

  app.post('/v1/invoices/preview', { preHandler: requirePermission('invoice:preview') }, async request => {
    const body = validateBody(request, previewBodySchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: body.shopId, action: 'invoice:read' });
    return { data: await createInvoicePreview({ tenantId: request.user!.tenantId, shopId: body.shopId, orderId: body.orderId, invoiceType: body.invoiceType }) };
  });

  app.post('/v1/invoices/create-draft', { preHandler: requirePermission('invoice:create') }, async (request, reply) => {
    const body = validateBody(request, previewBodySchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: body.shopId, action: 'invoice:create' });
    const preview = await createInvoicePreview({ tenantId: request.user!.tenantId, shopId: body.shopId, orderId: body.orderId, invoiceType: body.invoiceType });
    if (preview.invoiceRequest) {
      assertInvoiceRequestReadyForDraft(preview.invoiceRequest);
      assertCompanyPayloadMatchesRequest(preview.invoiceRequest, preview.payload);
    }
    const result = await createOrReuseDraftJob({
      tenantId: request.user!.tenantId,
      shopId: body.shopId,
      actorUserId: request.user!.id,
      sourceOrderId: body.orderId,
      invoiceType: body.invoiceType,
      sourceOrderSnapshot: preview.sourceOrderSnapshot,
      requestPayload: preview.payload,
      warnings: preview.warnings,
      invoiceBuyerRequestSnapshot: preview.invoiceRequest ? {
        buyerType: preview.invoiceRequest.buyerType,
        contactName: preview.invoiceRequest.contactName,
        buyerEmail: preview.invoiceRequest.buyerEmail,
        buyerPhone: preview.invoiceRequest.buyerPhone,
        invoiceAddress: preview.invoiceRequest.invoiceAddress,
        taxCode: preview.invoiceRequest.taxCode,
        legalName: preview.invoiceRequest.legalName,
        buyerUnitName: preview.invoiceRequest.buyerUnitName,
        identityNumber: preview.invoiceRequest.identityNumber
      } : null
    });
    await tryWriteAuditLog({
      tenantId: request.user!.tenantId,
      tenantShopId: body.shopId,
      actorUserId: request.user!.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.INVOICE_DRAFT_REQUESTED,
      resourceType: 'invoice_job',
      resourceId: result.invoiceJob.id,
      metadata: { orderId: body.orderId, source: 'preview_flow' },
      correlationId: request.id
    });
    reply.status(202);
    return { data: result };
  });

  app.post('/v1/invoices/issue', { preHandler: requirePermission('invoice:issue') }, async (request, reply) => {
    const body = validateBody(request, z.object({ invoiceJobId: z.string().uuid() }));
    const job = await getInvoiceJob(request.user!.tenantId, body.invoiceJobId);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: job.tenant_shop_id, action: 'invoice:issue' });
    const result = await enqueueIssueJob({ tenantId: request.user!.tenantId, invoiceJobId: body.invoiceJobId, actorUserId: request.user!.id });
    await tryWriteAuditLog({
      tenantId: request.user!.tenantId,
      tenantShopId: job.tenant_shop_id,
      actorUserId: request.user!.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.INVOICE_ISSUE_REQUESTED,
      resourceType: 'invoice_job',
      resourceId: body.invoiceJobId,
      correlationId: request.id
    });
    reply.status(202);
    return { data: result };
  });

  app.get('/v1/invoices/jobs', { preHandler: requirePermission('jobs:read') }, async request => {
    const { limit, shopId } = validateQuery(request, jobsQuerySchema);
    if (shopId) await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId, action: 'jobs:read' });
    const shopIds = shopId ? [shopId] : await accessibleShopIds({ tenantId: request.user!.tenantId, userId: request.user!.id });
    return { data: await listInvoiceJobs(request.user!.tenantId, limit, shopIds) };
  });

  app.get('/v1/invoices/jobs/:jobId', { preHandler: requirePermission('jobs:read') }, async request => {
    const { jobId } = validateParams(request, invoiceJobParamsSchema);
    const job = await getInvoiceJob(request.user!.tenantId, jobId);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: job.tenant_shop_id, action: 'jobs:read' });
    return { data: job };
  });

  app.post('/v1/invoices/jobs/:jobId/retry', { preHandler: requirePermission('jobs:retry') }, async (request, reply) => {
    const { jobId } = validateParams(request, invoiceJobParamsSchema);
    const job = await getInvoiceJob(request.user!.tenantId, jobId);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: job.tenant_shop_id, action: 'jobs:retry' });
    const result = await retryInvoiceJob(request.user!.tenantId, jobId);
    await tryWriteAuditLog({
      tenantId: request.user!.tenantId,
      tenantShopId: job.tenant_shop_id,
      actorUserId: request.user!.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.INVOICE_RETRY_REQUESTED,
      resourceType: 'invoice_job',
      resourceId: jobId,
      correlationId: request.id
    });
    reply.status(202);
    return { data: result };
  });

  app.post('/v1/invoices/jobs/:jobId/check-status', { preHandler: requirePermission('jobs:read') }, async request => {
    const { jobId } = validateParams(request, invoiceJobParamsSchema);
    const job = await getInvoiceJob(request.user!.tenantId, jobId);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: job.tenant_shop_id, action: 'jobs:read' });
    if (job.status.includes('issue')) return { data: await handlePollIssue(request.user!.tenantId, jobId) };
    return { data: await handlePollCreate(request.user!.tenantId, jobId) };
  });

  app.post('/v1/invoices/jobs/:jobId/refresh', { preHandler: requirePermission('jobs:read') }, async request => {
    const { jobId } = validateParams(request, invoiceJobParamsSchema);
    const job = await getInvoiceJob(request.user!.tenantId, jobId);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: job.tenant_shop_id, action: 'jobs:read' });
    return { data: await handleRefresh(request.user!.tenantId, jobId) };
  });

  app.get('/v1/invoices/jobs/:jobId/download/:type', { preHandler: requirePermission('invoice:download') }, async request => {
    const { jobId, type } = validateParams(request, downloadParamsSchema);
    const job = await getInvoiceJob(request.user!.tenantId, jobId);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: job.tenant_shop_id, action: 'invoice:download' });
    await tryWriteAuditLog({
      tenantId: request.user!.tenantId,
      tenantShopId: job.tenant_shop_id,
      actorUserId: request.user!.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.INVOICE_DOWNLOAD_REQUESTED,
      resourceType: 'invoice_job',
      resourceId: jobId,
      metadata: { type },
      correlationId: request.id
    });
    return { data: await downloadInvoiceArtifact(request.user!.tenantId, jobId, type) };
  });

  app.get('/v1/invoices/requests/:shopId/:orderId', { preHandler: requirePermission('invoice:read') }, async request => {
    const { shopId, orderId } = validateParams(request, buyerRequestParamsSchema);
    const tenantId = request.user!.tenantId;
    await assertUserCanAccessShopForAction({ tenantId, userId: request.user!.id, shopId, action: 'invoice:read' });
    const saved = await getInvoiceBuyerRequest(tenantId, shopId, orderId);
    if (saved) return { data: { ...saved, source: 'saved' } };

    const [pancakeClient, sepayConfig] = await Promise.all([
      pancakeClientForShop(tenantId, shopId),
      getSepayConfigForShop(tenantId, shopId)
    ]);
    const raw = await pancakeClient.getOrder(orderId);
    const result = await getInvoiceBuyerRequestOrSuggested(tenantId, shopId, orderId, unwrapOrder(raw), sepayConfig);
    return { data: result };
  });

  app.put('/v1/invoices/requests/:shopId/:orderId', { preHandler: requirePermission('invoice:create') }, async request => {
    const { shopId, orderId } = validateParams(request, buyerRequestParamsSchema);
    const body = validateBody(request, invoiceBuyerRequestSchema);
    const tenantId = request.user!.tenantId;
    await assertUserCanAccessShopForAction({ tenantId, userId: request.user!.id, shopId, action: 'invoice:create' });
    const existingJob = await findInvoiceJobByOrder(tenantId, shopId, orderId);
    if (existingJob && ['issue_queued', 'issue_running', 'issue_polling', 'issued'].includes(existingJob.status)) {
      throw new AppError('VALIDATION_ERROR', 'Hóa đơn đã phát hành hoặc đang phát hành, không thể thay đổi thông tin HĐ.', 409);
    }
    const sepayConfig = await getSepayConfigForShop(tenantId, shopId);
    const normalized = normalizeInvoiceRequestForProcessing({
      ...body,
      paymentMethod: body.paymentMethod ?? sepayConfig.default_payment_method,
      templateCode: body.templateCode ?? sepayConfig.template_code,
      invoiceSeries: body.invoiceSeries ?? sepayConfig.invoice_series,
      taxRate: body.taxRate ?? sepayConfig.default_tax_rate
    });
    validateInvoiceRequest(normalized);
    const result = await upsertInvoiceBuyerRequest(tenantId, shopId, orderId, normalized);
    return { data: { ...result, source: 'saved' } };
  });

  app.get('/v1/invoices/requests/:shopId/:orderId/draft-status', { preHandler: requirePermission('invoice:read') }, async request => {
    const { shopId, orderId } = validateParams(request, buyerRequestParamsSchema);
    const tenantId = request.user!.tenantId;
    await assertUserCanAccessShopForAction({ tenantId, userId: request.user!.id, shopId, action: 'invoice:read' });
    const [currentRequest, existingJob] = await Promise.all([
      getInvoiceBuyerRequest(tenantId, shopId, orderId),
      findInvoiceJobByOrder(tenantId, shopId, orderId)
    ]);
    if (!existingJob) {
      return { data: { hasDraft: false, outdated: false, requiresDraftRecreate: false, wrongCompanyDraft: false, draftOutdatedMessage: '' } };
    }
    const hasDraft = Boolean(existingJob);
    let outdated = false;
    let wrongCompanyDraft = false;
    if (existingJob.invoice_request_hash && existingJob.invoice_buyer_request_snapshot_json && currentRequest) {
      const currentHash = computeInvoiceRequestHashFromObject({
        buyerType: currentRequest.buyerType,
        taxCode: currentRequest.taxCode,
        legalName: currentRequest.legalName,
        buyerUnitName: currentRequest.buyerUnitName,
        invoiceAddress: currentRequest.invoiceAddress,
        identityNumber: currentRequest.identityNumber
      });
      outdated = currentHash !== existingJob.invoice_request_hash;
    }
    if (currentRequest?.buyerType === 'company') {
      const buyer = typeof existingJob.request_payload_json?.buyer === 'object' && existingJob.request_payload_json.buyer !== null
        ? existingJob.request_payload_json.buyer as Record<string, unknown>
        : {};
      wrongCompanyDraft = String(buyer.type ?? '').toLowerCase() !== 'company' || !buyer.tax_code || !buyer.address;
    }
    const requiresDraftRecreate = outdated || wrongCompanyDraft || Boolean(existingJob.requires_draft_recreate);
    return {
      data: {
        hasDraft,
        outdated,
        requiresDraftRecreate,
        wrongCompanyDraft,
        draftOutdatedMessage: wrongCompanyDraft
          ? 'Thông tin HĐ đang chọn Công ty nhưng bản nháp hiện tại không khớp. Vui lòng tạo lại nháp.'
          : (outdated ? 'Thông tin HĐ đã thay đổi sau khi tạo nháp. Vui lòng tạo lại nháp trước khi phát hành.' : ''),
        draftStatus: existingJob.status,
        invoiceJobId: existingJob.id
      }
    };
  });
}

function unwrapOrder(raw: unknown): Record<string, unknown> {
  const wrapper = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  return typeof wrapper.data === 'object' && wrapper.data !== null ? wrapper.data as Record<string, unknown> : wrapper;
}
