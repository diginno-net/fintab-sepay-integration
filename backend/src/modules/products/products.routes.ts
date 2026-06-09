import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { AppError } from '../../shared/http/errors.js';
import { validateParams, validateQuery, validateBody } from '../../shared/http/validate.js';
import { getProductById, listProducts, lookupProductByCode } from './product-catalog.service.js';
import { importFintabProducts } from './product-import.service.js';
import { syncPancakeProductsForShop } from './pancake-product-sync.service.js';
import { assertShopBelongsToTenant } from '../tenant/tenant-shop.service.js';

const productParamsSchema = z.object({ id: z.string().uuid() });
const lookupParamsSchema = z.object({ code: z.string().min(1) });
const productsQuerySchema = z.object({
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
    return { data: await listProducts(request.user!.tenantId, filters) };
  });

  app.get('/v1/products/lookup/:code', { preHandler: requirePermission('products:read') }, async request => {
    const { code } = validateParams(request, lookupParamsSchema);
    return { data: await lookupProductByCode(request.user!.tenantId, code) };
  });

  app.get('/v1/products/:id', { preHandler: requirePermission('products:read') }, async request => {
    const { id } = validateParams(request, productParamsSchema);
    return { data: await getProductById(request.user!.tenantId, id) };
  });

  app.post('/v1/products/import', { preHandler: requirePermission('products:import') }, async request => {
    const file = await request.file();
    if (!file) throw new AppError('VALIDATION_ERROR', 'Missing import file', 400);
    const buffer = await file.toBuffer();
    return { data: await importFintabProducts(request.user!.tenantId, buffer, file.filename) };
  });

  app.post('/v1/products/sync/pancake', { preHandler: requirePermission('products:import') }, async request => {
    const { shopId, pageSize, maxPages } = validateBody(request, syncPancakeSchema);
    await assertShopBelongsToTenant(request.user!.tenantId, shopId);
    return { data: await syncPancakeProductsForShop({ tenantId: request.user!.tenantId, shopId, pageSize, maxPages }) };
  });
}
