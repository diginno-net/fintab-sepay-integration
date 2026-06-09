import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { validateBody, validateParams } from '../../shared/http/validate.js';
import { query } from '../../shared/persistence/db.js';
import { assertShopBelongsToTenant, listTenantShops } from './tenant-shop.service.js';

const shopParamsSchema = z.object({ shopId: z.string().uuid() });
const createShopSchema = z.object({
  external_shop_id: z.string().min(1),
  shop_name: z.string().min(1),
  config_json: z.record(z.unknown()).default({})
});
const updateTenantSchema = z.object({ name: z.string().min(1) });

export async function registerTenantRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/tenant-shops', { preHandler: requirePermission('tenant_shop:read') }, async request => ({
    data: await listTenantShops(request.user!.tenantId)
  }));

  app.post('/v1/tenant-shops', { preHandler: requirePermission('tenant_shop:write') }, async request => {
    const body = validateBody(request, createShopSchema);
    const rows = await query(
      `INSERT INTO tenant_shops(tenant_id, provider, external_shop_id, shop_name, config_json)
       VALUES ($1, 'pancake', $2, $3, $4)
       ON CONFLICT (tenant_id, provider, external_shop_id)
       DO UPDATE SET shop_name = EXCLUDED.shop_name, config_json = EXCLUDED.config_json
       RETURNING *`,
      [request.user!.tenantId, body.external_shop_id, body.shop_name, body.config_json]
    );
    return { data: rows[0] };
  });

  app.get('/v1/tenant-shops/:shopId', { preHandler: requirePermission('tenant_shop:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    return { data: await assertShopBelongsToTenant(request.user!.tenantId, shopId) };
  });

  app.put('/v1/tenant', { preHandler: requirePermission('tenant:write') }, async request => {
    const body = validateBody(request, updateTenantSchema);
    const rows = await query(
      `UPDATE tenants SET name = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [request.user!.tenantId, body.name]
    );
    return { data: rows[0] };
  });
}
