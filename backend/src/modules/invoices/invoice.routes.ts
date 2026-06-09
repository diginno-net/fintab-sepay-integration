import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { validateBody, validateParams, validateQuery } from '../../shared/http/validate.js';
import { downloadInvoiceArtifact, handlePollCreate, handlePollIssue, handleRefresh } from '../jobs/job-handlers.js';
import { createOrReuseDraftJob, enqueueIssueJob, getInvoiceJob, listInvoiceJobs, retryInvoiceJob } from './invoice-job.service.js';
import { createInvoicePreview } from './invoice.service.js';

const previewBodySchema = z.object({
  shopId: z.string().uuid(),
  orderId: z.string().min(1),
  invoiceType: z.enum(['gtgt', 'ban_hang']).default('ban_hang')
});
const invoiceJobParamsSchema = z.object({ jobId: z.string().uuid() });
const downloadParamsSchema = z.object({ jobId: z.string().uuid(), type: z.enum(['pdf', 'xml']) });
const jobsQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });

export async function registerInvoiceRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/invoices/preview', { preHandler: requirePermission('invoice:preview') }, async request => {
    const body = validateBody(request, previewBodySchema);
    return { data: await createInvoicePreview({ tenantId: request.user!.tenantId, shopId: body.shopId, orderId: body.orderId, invoiceType: body.invoiceType }) };
  });

  app.post('/v1/invoices/create-draft', { preHandler: requirePermission('invoice:create') }, async (request, reply) => {
    const body = validateBody(request, previewBodySchema);
    const preview = await createInvoicePreview({ tenantId: request.user!.tenantId, shopId: body.shopId, orderId: body.orderId, invoiceType: body.invoiceType });
    const result = await createOrReuseDraftJob({
      tenantId: request.user!.tenantId,
      shopId: body.shopId,
      actorUserId: request.user!.id,
      sourceOrderId: body.orderId,
      invoiceType: body.invoiceType,
      sourceOrderSnapshot: preview.sourceOrderSnapshot,
      requestPayload: preview.payload,
      warnings: preview.warnings
    });
    reply.status(202);
    return { data: result };
  });

  app.post('/v1/invoices/issue', { preHandler: requirePermission('invoice:issue') }, async (request, reply) => {
    const body = validateBody(request, z.object({ invoiceJobId: z.string().uuid() }));
    const result = await enqueueIssueJob({ tenantId: request.user!.tenantId, invoiceJobId: body.invoiceJobId, actorUserId: request.user!.id });
    reply.status(202);
    return { data: result };
  });

  app.get('/v1/invoices/jobs', { preHandler: requirePermission('jobs:read') }, async request => {
    const { limit } = validateQuery(request, jobsQuerySchema);
    return { data: await listInvoiceJobs(request.user!.tenantId, limit) };
  });

  app.get('/v1/invoices/jobs/:jobId', { preHandler: requirePermission('jobs:read') }, async request => {
    const { jobId } = validateParams(request, invoiceJobParamsSchema);
    return { data: await getInvoiceJob(request.user!.tenantId, jobId) };
  });

  app.post('/v1/invoices/jobs/:jobId/retry', { preHandler: requirePermission('jobs:retry') }, async (request, reply) => {
    const { jobId } = validateParams(request, invoiceJobParamsSchema);
    const result = await retryInvoiceJob(request.user!.tenantId, jobId);
    reply.status(202);
    return { data: result };
  });

  app.post('/v1/invoices/jobs/:jobId/check-status', { preHandler: requirePermission('jobs:read') }, async request => {
    const { jobId } = validateParams(request, invoiceJobParamsSchema);
    const job = await getInvoiceJob(request.user!.tenantId, jobId);
    if (job.status.includes('issue')) return { data: await handlePollIssue(request.user!.tenantId, jobId) };
    return { data: await handlePollCreate(request.user!.tenantId, jobId) };
  });

  app.post('/v1/invoices/jobs/:jobId/refresh', { preHandler: requirePermission('jobs:read') }, async request => {
    const { jobId } = validateParams(request, invoiceJobParamsSchema);
    return { data: await handleRefresh(request.user!.tenantId, jobId) };
  });

  app.get('/v1/invoices/jobs/:jobId/download/:type', { preHandler: requirePermission('invoice:download') }, async request => {
    const { jobId, type } = validateParams(request, downloadParamsSchema);
    return { data: await downloadInvoiceArtifact(request.user!.tenantId, jobId, type) };
  });
}
