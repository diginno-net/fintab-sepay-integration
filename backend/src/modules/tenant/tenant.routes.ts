import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { validateBody, validateParams } from '../../shared/http/validate.js';
import { query } from '../../shared/persistence/db.js';
import { listAccessibleShops } from './shop-access.service.js';
import { assertUserCanAccessShopForAction } from './shop-access.service.js';
import { listUserShopAccessSummaries, replaceUserShopAccess } from './shop-access.service.js';
import { AUDIT_ACTIONS, tryWriteAuditLog } from '../audit/audit.service.js';

const shopParamsSchema = z.object({ shopId: z.string().uuid() });
const createShopSchema = z.object({
  external_shop_id: z.string().min(1),
  shop_name: z.string().min(1),
  config_json: z.record(z.unknown()).default({})
});
const updateTenantSchema = z.object({ name: z.string().min(1) });
const userParamsSchema = z.object({ userId: z.string().uuid() });
const replaceUserShopAccessSchema = z.object({
  shops: z.array(z.object({
    shopId: z.string().uuid(),
    accessLevel: z.enum(['owner', 'admin', 'member', 'viewer'])
  })).default([]),
  defaultShopId: z.string().uuid().nullable().optional()
});

export async function registerTenantRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/tenant-shops', { preHandler: requirePermission('tenant_shop:read') }, async request => ({
    data: await listAccessibleShops({ tenantId: request.user!.tenantId, userId: request.user!.id })
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
    await query(
      `INSERT INTO user_shop_access(tenant_id, user_id, tenant_shop_id, access_level, is_default)
       VALUES ($1, $2, $3, 'admin', NOT EXISTS (
         SELECT 1 FROM user_shop_access WHERE tenant_id = $1 AND user_id = $2
       ))
       ON CONFLICT (tenant_id, user_id, tenant_shop_id) DO NOTHING`,
      [request.user!.tenantId, request.user!.id, (rows[0] as { id: string }).id]
    );
    return { data: rows[0] };
  });

  app.get('/v1/tenant-shops/:shopId', { preHandler: requirePermission('tenant_shop:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    return { data: await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId, action: 'shop:read' }) };
  });

  app.put('/v1/tenant', { preHandler: requirePermission('tenant:write') }, async request => {
    const body = validateBody(request, updateTenantSchema);
    const rows = await query(
      `UPDATE tenants SET name = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [request.user!.tenantId, body.name]
    );
    return { data: rows[0] };
  });

  app.get('/v1/shop-access/users', { preHandler: requirePermission('shop_access:read') }, async request => ({
    data: await listUserShopAccessSummaries(request.user!.tenantId)
  }));

  app.put('/v1/shop-access/users/:userId/shops', { preHandler: requirePermission('shop_access:write') }, async request => {
    const { userId } = validateParams(request, userParamsSchema);
    const body = validateBody(request, replaceUserShopAccessSchema);
    await replaceUserShopAccess({
      tenantId: request.user!.tenantId,
      targetUserId: userId,
      shops: body.shops,
      defaultShopId: body.defaultShopId ?? null
    });
    await tryWriteAuditLog({
      tenantId: request.user!.tenantId,
      actorUserId: request.user!.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.SHOP_ACCESS_UPDATED,
      resourceType: 'user_shop_access',
      resourceId: userId,
      metadata: { targetUserId: userId, shopCount: body.shops.length, defaultShopId: body.defaultShopId ?? null },
      correlationId: request.id
    });
    return { data: { ok: true } };
  });
}
