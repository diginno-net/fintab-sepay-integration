import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { AppError } from '../../shared/http/errors.js';
import { validateParams, validateQuery } from '../../shared/http/validate.js';
import { getJobForTenant, listJobsForTenant, markJobForRetry, type ListJobsFilters } from '../../shared/queue/job-queue.js';
import { AUDIT_ACTIONS, tryWriteAuditLog } from '../audit/audit.service.js';
import { accessibleShopIds, assertUserCanAccessShopForAction } from '../tenant/shop-access.service.js';

const jobParamsSchema = z.object({ jobId: z.string().uuid() });
const jobsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  shopId: z.string().uuid().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export async function registerJobsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/jobs', { preHandler: requirePermission('jobs:read') }, async request => {
    const { limit, shopId, type, status, fromDate, toDate } = validateQuery(request, jobsQuerySchema);
    if (shopId) await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId, action: 'jobs:read' });
    const shopIds = shopId ? undefined : await accessibleShopIds({ tenantId: request.user!.tenantId, userId: request.user!.id });
    return { data: await listJobsForTenant(request.user!.tenantId, { limit, shopId, shopIds, type, status, fromDate, toDate }) };
  });

  app.get('/v1/jobs/:jobId', { preHandler: requirePermission('jobs:read') }, async request => {
    const { jobId } = validateParams(request, jobParamsSchema);
    const job = await getJobForTenant(request.user!.tenantId, jobId);
    if (!job) throw new AppError('NOT_FOUND', 'Job not found', 404);
    if (job.tenant_shop_id) await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: job.tenant_shop_id, action: 'jobs:read' });
    return { data: job };
  });

  app.post('/v1/jobs/:jobId/retry', { preHandler: requirePermission('jobs:retry') }, async request => {
    const { jobId } = validateParams(request, jobParamsSchema);
    const current = await getJobForTenant(request.user!.tenantId, jobId);
    if (!current) throw new AppError('NOT_FOUND', 'Retryable job not found', 404);
    if (current.tenant_shop_id) await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: current.tenant_shop_id, action: 'jobs:retry' });
    const job = await markJobForRetry(request.user!.tenantId, jobId);
    if (!job) throw new AppError('NOT_FOUND', 'Retryable job not found', 404);
    await tryWriteAuditLog({
      tenantId: request.user!.tenantId,
      tenantShopId: current.tenant_shop_id,
      actorUserId: request.user!.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.INVOICE_RETRY_REQUESTED,
      resourceType: 'background_job',
      resourceId: jobId,
      metadata: { type: current.type },
      correlationId: request.id
    });
    return { data: job };
  });
}
