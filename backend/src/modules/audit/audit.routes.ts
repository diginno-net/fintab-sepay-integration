import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { validateQuery } from '../../shared/http/validate.js';
import { query } from '../../shared/persistence/db.js';

const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export async function registerAuditRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/audit-logs', { preHandler: requirePermission('audit:read') }, async request => {
    const { limit } = validateQuery(request, auditQuerySchema);
    const rows = await query(
      `SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [request.user!.tenantId, limit]
    );
    return { data: rows };
  });
}
