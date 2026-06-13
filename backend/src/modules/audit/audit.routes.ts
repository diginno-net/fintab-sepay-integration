import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { AppError } from '../../shared/http/errors.js';
import { validateQuery } from '../../shared/http/validate.js';
import { query } from '../../shared/persistence/db.js';
import { accessibleShopIds, assertUserCanAccessShopForAction } from '../tenant/shop-access.service.js';

const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  actorType: z.enum(['user', 'worker', 'webhook', 'system']).optional(),
  action: z.string().min(1).max(120).optional(),
  resource: z.string().min(1).max(120).optional(),
  shopId: z.string().uuid().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional()
});

export async function registerAuditRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/audit-logs', { preHandler: requirePermission('audit:read') }, async request => {
    const filters = validateQuery(request, auditQuerySchema);
    if (filters.shopId) {
      await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: filters.shopId, action: 'audit:read' });
    }
    const shopIds = filters.shopId ? [filters.shopId] : await accessibleShopIds({ tenantId: request.user!.tenantId, userId: request.user!.id });
    if (filters.fromDate && filters.toDate && new Date(filters.fromDate).getTime() > new Date(filters.toDate).getTime()) {
      throw new AppError('VALIDATION_ERROR', 'fromDate must be before toDate', 400);
    }

    const conditions = ['tenant_id = $1', '(tenant_shop_id = ANY($2::uuid[]) OR tenant_shop_id IS NULL)'];
    const params: unknown[] = [request.user!.tenantId, shopIds];
    let index = 3;
    if (filters.actorType) { conditions.push(`actor_type = $${index++}`); params.push(filters.actorType); }
    if (filters.action) { conditions.push(`action ILIKE $${index++}`); params.push(`%${filters.action}%`); }
    if (filters.resource) { conditions.push(`resource_type ILIKE $${index++}`); params.push(`%${filters.resource}%`); }
    if (filters.fromDate) { conditions.push(`created_at >= $${index++}`); params.push(filters.fromDate); }
    if (filters.toDate) { conditions.push(`created_at <= $${index++}`); params.push(filters.toDate); }
    params.push(filters.limit);

    const rows = await query(
      `SELECT * FROM audit_logs
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${index}`,
      params
    );
    return { data: rows };
  });
}
