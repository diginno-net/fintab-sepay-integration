import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { validateParams, validateQuery } from '../../shared/http/validate.js';
import { pancakeClientForShop } from './pancake.service.js';
import { hasExistingInvoice } from './pancake-status-policy.js';

const shopParamsSchema = z.object({ shopId: z.string().uuid() });
const orderParamsSchema = z.object({ shopId: z.string().uuid(), orderId: z.string().min(1) });
const ordersQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  updateStatus: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  page_size: z.coerce.number().int().positive().max(100).optional()
});

export async function registerPancakeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/pancake/shops/:shopId/orders', { preHandler: requirePermission('orders:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    const query = validateQuery(request, ordersQuerySchema);
    const client = await pancakeClientForShop(request.user!.tenantId, shopId);
    return { data: await client.listOrders(query) };
  });

  app.get('/v1/pancake/shops/:shopId/orders/:orderId', { preHandler: requirePermission('orders:read') }, async request => {
    const { shopId, orderId } = validateParams(request, orderParamsSchema);
    const client = await pancakeClientForShop(request.user!.tenantId, shopId);
    const raw = await client.getOrder(orderId);
    const wrapper = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
    const orderRecord = (typeof wrapper.data === 'object' && wrapper.data !== null) ? wrapper.data as Record<string, unknown> : wrapper;
    return { data: orderRecord, meta: { has_existing_invoice: hasExistingInvoice(orderRecord) } };
  });

  app.get('/v1/pancake/shops/:shopId/products', { preHandler: requirePermission('products:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    const query = validateQuery(request, ordersQuerySchema);
    const client = await pancakeClientForShop(request.user!.tenantId, shopId);
    return { data: await client.listProducts(query) };
  });
}
