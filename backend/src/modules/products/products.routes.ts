import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { AppError } from '../../shared/http/errors.js';
import { validateParams, validateQuery, validateBody } from '../../shared/http/validate.js';
import { getProductById, listProducts, lookupProductByCode } from './product-catalog.service.js';
import { importFintabProducts } from './product-import.service.js';
import { syncPancakeProductsForShop } from './pancake-product-sync.service.js';
import { accessibleShopIds, assertUserCanAccessShopForAction } from '../tenant/shop-access.service.js';

const productParamsSchema = z.object({ id: z.string().uuid() });
const lookupParamsSchema = z.object({ code: z.string().min(1) });
const lookupQuerySchema = z.object({ shopId: z.string().uuid().optional() });
const productsQuerySchema = z.object({
  shopId: z.string().uuid().optional(),
  search: z.string().optional(),
  group: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100)
});
const syncPancakeSchema = z.object({
  shopId: z.string().uuid(),
  pageSize: z.coerce.number().int().min(1).max(500).default(100).optional(),
  maxPages: z.coerce.number().int().min(1).max(100).default(20).optional()
});

export async function registerProductRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/products', { preHandler: requirePermission('products:read') }, async request => {
    const filters = validateQuery(request, productsQuerySchema);
    if (filters.shopId) await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: filters.shopId, action: 'products:read' });
    const shopIds = filters.shopId ? undefined : await accessibleShopIds({ tenantId: request.user!.tenantId, userId: request.user!.id });
    if (!filters.shopId && shopIds?.length === 0) return { data: [] };
    return { data: await listProducts(request.user!.tenantId, { ...filters, shopIds }) };
  });

  app.get('/v1/products/lookup/:code', { preHandler: requirePermission('products:read') }, async request => {
    const { code } = validateParams(request, lookupParamsSchema);
    const { shopId } = validateQuery(request, lookupQuerySchema);
    if (shopId) await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId, action: 'products:read' });
    const product = await lookupProductByCode(request.user!.tenantId, code, shopId ?? null);
    if (product?.tenant_shop_id) await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: product.tenant_shop_id, action: 'products:read' });
    return { data: product };
  });

  app.get('/v1/products/:id', { preHandler: requirePermission('products:read') }, async request => {
    const { id } = validateParams(request, productParamsSchema);
    const product = await getProductById(request.user!.tenantId, id);
    if (product.tenant_shop_id) await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId: product.tenant_shop_id, action: 'products:read' });
    return { data: product };
  });

  app.post('/v1/products/import', { preHandler: requirePermission('products:import') }, async request => {
    const file = await request.file();
    if (!file) throw new AppError('VALIDATION_ERROR', 'Missing import file', 400);
    const buffer = await file.toBuffer();
    return { data: await importFintabProducts(request.user!.tenantId, buffer, file.filename) };
  });

  app.post('/v1/products/sync/pancake', { preHandler: requirePermission('products:import') }, async request => {
    const { shopId, pageSize, maxPages } = validateBody(request, syncPancakeSchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId, action: 'products:write' });
    return { data: await syncPancakeProductsForShop({ tenantId: request.user!.tenantId, shopId, pageSize, maxPages }) };
  });
}
