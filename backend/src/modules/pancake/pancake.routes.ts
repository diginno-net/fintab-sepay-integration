import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { validateBody, validateParams, validateQuery } from '../../shared/http/validate.js';
import { pancakeClientForShop } from './pancake.service.js';
import { hasExistingInvoice } from './pancake-status-policy.js';
import { hasPancakeOrderSnapshots, latestPancakeOrderSyncRun, listPancakeOrderSnapshots, listPancakeOrderSyncRuns, startPancakeOrderFullSync } from './pancake-order-sync.service.js';
import { parsePancakeOrderPage } from './pancake-order-pagination.js';
import { getPancakePaymentStatus } from './pancake-payment-policy.js';
import { buildOrderListQuery, type PancakeOrderFilterInput } from './pancake-order-filter.js';
import { assertUserCanAccessShopForAction } from '../tenant/shop-access.service.js';

const shopParamsSchema = z.object({ shopId: z.string().uuid() });
const orderParamsSchema = z.object({ shopId: z.string().uuid(), orderId: z.string().min(1) });
const booleanQuerySchema = z.preprocess(value => value === 'true' || value === true, z.boolean());
const arrayQuerySchema = z.preprocess(value => Array.isArray(value) ? value : (value === undefined ? undefined : [value]), z.array(z.union([z.string(), z.number()])).optional());
const ordersQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  updateStatus: z.string().optional(),
  startDateTime: z.coerce.number().int().positive().optional(),
  endDateTime: z.coerce.number().int().positive().optional(),
  optionSort: z.string().optional(),
  option_sort: z.string().optional(),
  filterStatus: arrayQuerySchema,
  filter_status: arrayQuerySchema,
  'filter_status[]': arrayQuerySchema,
  completedOnly: booleanQuerySchema.optional().default(false),
  completedDays: z.coerce.number().int().positive().max(365).optional(),
  page: z.coerce.number().int().positive().optional(),
  page_size: z.coerce.number().int().positive().max(100).optional(),
  paidOnly: booleanQuerySchema.optional().default(false)
});
const syncOrdersBodySchema = z.object({
  pageSize: z.coerce.number().int().positive().max(100).optional().default(100),
  completedOnly: z.boolean().optional().default(false),
  completedDays: z.coerce.number().int().positive().max(365).optional(),
  filterStatus: z.array(z.union([z.string(), z.number()])).optional(),
  updateStatus: z.string().optional(),
  startDateTime: z.coerce.number().int().positive().optional(),
  endDateTime: z.coerce.number().int().positive().optional(),
  optionSort: z.string().optional()
});

export async function registerPancakeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/pancake/shops/:shopId/orders', { preHandler: requirePermission('orders:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    const query = validateQuery(request, ordersQuerySchema);
    const tenantId = request.user!.tenantId;
    await assertUserCanAccessShopForAction({ tenantId, userId: request.user!.id, shopId, action: 'orders:read' });
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 100;
    const syncRun = await latestPancakeOrderSyncRun(tenantId, shopId);

    if (await hasPancakeOrderSnapshots(tenantId, shopId)) {
      const result = await listPancakeOrderSnapshots({
        tenantId,
        shopId,
        page,
        pageSize,
        search: query.search,
        paidOnly: query.paidOnly,
        pancakeStatus: snapshotPancakeStatus(query),
        updatedFromUnix: query.completedOnly ? buildOrderListQuery(filterInputFromQuery(query)).startDateTime as number | undefined : query.startDateTime,
        updatedToUnix: query.completedOnly ? buildOrderListQuery(filterInputFromQuery(query)).endDateTime as number | undefined : query.endDateTime,
        dateFrom: query.date_from,
        dateTo: query.date_to
      });
      return {
        data: {
          source: 'snapshot',
          syncRun,
          pagination: {
            page,
            pageSize,
            totalEntries: result.totalEntries,
            totalPages: result.totalPages,
            hasNextPage: page < result.totalPages
          },
          rows: result.snapshots.map(snapshot => snapshot.raw_json)
        }
      };
    }

    const client = await pancakeClientForShop(tenantId, shopId);
    const raw = await client.listOrders(buildOrderListQuery({ ...filterInputFromQuery(query), page, page_number: page, page_size: pageSize }));
    const parsed = parsePancakeOrderPage(raw, { page, pageSize });
    const rows = query.paidOnly
      ? parsed.orders.filter(order => getPancakePaymentStatus(order).status === 'paid')
      : parsed.orders;
    return { data: { source: 'live', syncRun, pagination: parsed.pagination, rows } };
  });

  app.post('/v1/pancake/shops/:shopId/orders/sync', { preHandler: requirePermission('orders:read') }, async (request, reply) => {
    const { shopId } = validateParams(request, shopParamsSchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId, action: 'orders:sync' });
    const body = validateBody(request, syncOrdersBodySchema);
    const result = await startPancakeOrderFullSync({
      tenantId: request.user!.tenantId,
      shopId,
      pageSize: body.pageSize,
      filters: filterInputFromQuery(body)
    });
    reply.status(202);
    return { data: result };
  });

  app.get('/v1/pancake/shops/:shopId/orders/sync-runs', { preHandler: requirePermission('orders:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId, action: 'orders:read' });
    return { data: await listPancakeOrderSyncRuns(request.user!.tenantId, shopId, 10) };
  });

  app.get('/v1/pancake/shops/:shopId/orders/:orderId', { preHandler: requirePermission('orders:read') }, async request => {
    const { shopId, orderId } = validateParams(request, orderParamsSchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId, action: 'orders:read' });
    const client = await pancakeClientForShop(request.user!.tenantId, shopId);
    const raw = await client.getOrder(orderId);
    const wrapper = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
    const orderRecord = (typeof wrapper.data === 'object' && wrapper.data !== null) ? wrapper.data as Record<string, unknown> : wrapper;
    return { data: orderRecord, meta: { has_existing_invoice: hasExistingInvoice(orderRecord) } };
  });

  app.get('/v1/pancake/shops/:shopId/products', { preHandler: requirePermission('products:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    const query = validateQuery(request, ordersQuerySchema);
    await assertUserCanAccessShopForAction({ tenantId: request.user!.tenantId, userId: request.user!.id, shopId, action: 'products:read' });
    const client = await pancakeClientForShop(request.user!.tenantId, shopId);
    return { data: await client.listProducts(query) };
  });
}

function filterInputFromQuery(query: {
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  updateStatus?: string;
  startDateTime?: number;
  endDateTime?: number;
  optionSort?: string;
  option_sort?: string;
  filterStatus?: Array<string | number>;
  filter_status?: Array<string | number>;
  'filter_status[]'?: Array<string | number>;
  completedOnly?: boolean;
  completedDays?: number;
}): PancakeOrderFilterInput {
  return {
    status: query.status,
    search: query.search,
    date_from: query.date_from,
    date_to: query.date_to,
    updateStatus: query.updateStatus,
    startDateTime: query.startDateTime,
    endDateTime: query.endDateTime,
    optionSort: query.optionSort,
    option_sort: query.option_sort,
    filterStatus: query.filterStatus ?? query.filter_status ?? query['filter_status[]'],
    completedOnly: query.completedOnly,
    completedDays: query.completedDays
  };
}

function snapshotPancakeStatus(query: Parameters<typeof filterInputFromQuery>[0]): string | undefined {
  if (query.completedOnly) return '3';
  const statuses = query.filterStatus ?? query.filter_status ?? query['filter_status[]'];
  if (statuses?.length === 1) return String(statuses[0]);
  return query.status;
}
