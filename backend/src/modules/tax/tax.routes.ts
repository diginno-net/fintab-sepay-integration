import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { validateBody, validateParams } from '../../shared/http/validate.js';
import { getProductTaxProfile, getShopTaxDefaults, upsertProductTaxProfile, upsertShopTaxDefaults } from './tax-profile.service.js';

const productParamsSchema = z.object({ id: z.string().uuid() });
const shopParamsSchema = z.object({ shopId: z.string().uuid() });
const taxProfileSchema = z.object({
  tenantShopId: z.string().uuid().nullable().optional(),
  taxRate: z.union([z.literal(-2), z.literal(-1), z.literal(0), z.literal(5), z.literal(8), z.literal(10)]),
  taxCategory: z.enum(['taxable', 'non_taxable', 'non_declarable', 'zero_rated']),
  invoiceLineType: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(1),
  invoiceUnit: z.string().nullable().optional(),
  isTaxInclusivePrice: z.boolean().default(true)
});
const taxDefaultsSchema = z.object({
  defaultTaxRate: z.union([z.literal(-2), z.literal(-1), z.literal(0), z.literal(5), z.literal(8), z.literal(10)]),
  defaultInvoiceUnit: z.string().default('cái'),
  defaultInvoiceType: z.enum(['gtgt', 'ban_hang']).default('ban_hang'),
  unknownProductPolicy: z.enum(['warn', 'block', 'use_default']).default('warn')
});

export async function registerTaxRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/products/:id/tax-profile', { preHandler: requirePermission('products:read') }, async request => {
    const { id } = validateParams(request, productParamsSchema);
    return { data: await getProductTaxProfile(request.user!.tenantId, id) };
  });

  app.put('/v1/products/:id/tax-profile', { preHandler: requirePermission('products:import') }, async request => {
    const { id } = validateParams(request, productParamsSchema);
    const body = validateBody(request, taxProfileSchema);
    return { data: await upsertProductTaxProfile(request.user!.tenantId, id, body) };
  });

  app.get('/v1/shops/:shopId/tax/defaults', { preHandler: requirePermission('integration:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    return { data: await getShopTaxDefaults(request.user!.tenantId, shopId) };
  });

  app.put('/v1/shops/:shopId/tax/defaults', { preHandler: requirePermission('integration:write') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    const body = validateBody(request, taxDefaultsSchema);
    return { data: await upsertShopTaxDefaults(request.user!.tenantId, shopId, body) };
  });
}
