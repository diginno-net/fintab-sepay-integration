import { enqueueJob } from '../../shared/queue/job-queue.js';
import { query } from '../../shared/persistence/db.js';
import { normalizeBuyer, normalizePayment } from './pancake-normalizers.js';
import { buildOrderListQuery, type PancakeOrderFilterInput } from './pancake-order-filter.js';
import { parsePancakeOrderPage } from './pancake-order-pagination.js';
import { getPancakePaymentStatus } from './pancake-payment-policy.js';
import { pancakeClientForShop } from './pancake.service.js';

export type PancakeOrderSyncRun = {
  id: string;
  tenant_id: string;
  tenant_shop_id: string;
  type: 'full' | 'incremental';
  status: 'queued' | 'running' | 'completed' | 'failed';
  current_page: number;
  page_size: number;
  total_pages: number;
  total_entries: number;
  synced_count: number;
  paid_count: number;
  failed_count: number;
  started_at: string | null;
  finished_at: string | null;
  error_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type PancakeOrderSnapshot = {
  id: string;
  tenant_id: string;
  tenant_shop_id: string;
  source_order_id: string;
  order_number: string | null;
  payment_status: 'paid' | 'unpaid' | 'unknown';
  raw_json: Record<string, unknown>;
};

export async function startPancakeOrderFullSync(input: { tenantId: string; shopId: string; pageSize?: number; filters?: PancakeOrderFilterInput }): Promise<{ syncRun: PancakeOrderSyncRun; jobId: string }> {
  const pageSize = Math.min(Math.max(input.pageSize ?? 100, 1), 100);
  const rows = await query<PancakeOrderSyncRun>(
    `INSERT INTO pancake_order_sync_runs(tenant_id, tenant_shop_id, type, status, page_size)
     VALUES ($1, $2, 'full', 'queued', $3)
     RETURNING *`,
    [input.tenantId, input.shopId, pageSize]
  );
  const syncRun = rows[0]!;
  const job = await enqueueJob({
    tenantId: input.tenantId,
    tenantShopId: input.shopId,
    type: 'pancake:orders-full-sync',
    payload: { syncRunId: syncRun.id, pageSize, filters: input.filters ?? {} },
    maxAttempts: 1,
    dedupeKey: `pancake-orders-full-sync:${input.tenantId}:${input.shopId}:${syncRun.id}`
  });
  return { syncRun, jobId: job.id };
}

export async function listPancakeOrderSyncRuns(tenantId: string, shopId: string, limit = 10): Promise<PancakeOrderSyncRun[]> {
  return query<PancakeOrderSyncRun>(
    `SELECT * FROM pancake_order_sync_runs
     WHERE tenant_id = $1 AND tenant_shop_id = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [tenantId, shopId, limit]
  );
}

export async function latestPancakeOrderSyncRun(tenantId: string, shopId: string): Promise<PancakeOrderSyncRun | null> {
  const rows = await listPancakeOrderSyncRuns(tenantId, shopId, 1);
  return rows[0] ?? null;
}

export async function processPancakeOrderFullSyncJob(input: { tenantId: string; shopId: string; syncRunId: string; pageSize?: number; filters?: PancakeOrderFilterInput }): Promise<void> {
  const pageSize = Math.min(Math.max(input.pageSize ?? 100, 1), 100);
  await query(
    `UPDATE pancake_order_sync_runs
     SET status = 'running', started_at = COALESCE(started_at, now()), page_size = $4, updated_at = now()
     WHERE tenant_id = $1 AND tenant_shop_id = $2 AND id = $3`,
    [input.tenantId, input.shopId, input.syncRunId, pageSize]
  );

  try {
    const client = await pancakeClientForShop(input.tenantId, input.shopId);
    let page = 1;
    let totalPages = 1;
    let totalEntries = 0;
    let synced = 0;
    let paid = 0;
    let failed = 0;

    do {
      const raw = await client.listOrders(buildOrderListQuery({ ...input.filters, page, page_number: page, page_size: pageSize }));
      const parsed = parsePancakeOrderPage(raw, { page, pageSize });
      totalPages = parsed.pagination.totalPages || totalPages;
      totalEntries = parsed.pagination.totalEntries || totalEntries;

      for (const order of parsed.orders) {
        try {
          const snapshot = await upsertPancakeOrderSnapshot(input.tenantId, input.shopId, order);
          synced += 1;
          if (snapshot.payment_status === 'paid') paid += 1;
        } catch {
          failed += 1;
        }
      }

      await query(
        `UPDATE pancake_order_sync_runs
         SET current_page = $4, total_pages = $5, total_entries = $6,
             synced_count = $7, paid_count = $8, failed_count = $9, updated_at = now()
         WHERE tenant_id = $1 AND tenant_shop_id = $2 AND id = $3`,
        [input.tenantId, input.shopId, input.syncRunId, page, totalPages, totalEntries, synced, paid, failed]
      );

      page += 1;
    } while (page <= totalPages);

    await query(
      `UPDATE pancake_order_sync_runs
       SET status = 'completed', finished_at = now(), updated_at = now()
       WHERE tenant_id = $1 AND tenant_shop_id = $2 AND id = $3`,
      [input.tenantId, input.shopId, input.syncRunId]
    );
  } catch (err) {
    await query(
      `UPDATE pancake_order_sync_runs
       SET status = 'failed', finished_at = now(), error_json = $4, updated_at = now()
       WHERE tenant_id = $1 AND tenant_shop_id = $2 AND id = $3`,
      [input.tenantId, input.shopId, input.syncRunId, { message: err instanceof Error ? err.message : String(err) }]
    );
    throw err;
  }
}

export async function upsertPancakeOrderSnapshot(tenantId: string, shopId: string, order: Record<string, unknown>): Promise<PancakeOrderSnapshot> {
  const sourceOrderId = stringValue(order.id ?? order.order_id ?? order.orderId);
  if (!sourceOrderId) throw new Error('Pancake order id is missing');
  const buyer = normalizeBuyer(order);
  const payment = normalizePayment(order);
  const paymentDecision = getPancakePaymentStatus(order);
  const rows = await query<PancakeOrderSnapshot>(
    `INSERT INTO pancake_order_snapshots(
       tenant_id, tenant_shop_id, source_order_id, order_number, customer_name, customer_phone, customer_email,
       total_amount, payment_status, payment_status_reason, pancake_status, pancake_status_label,
       pancake_inserted_at, pancake_updated_at, raw_json, last_synced_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now())
     ON CONFLICT (tenant_id, tenant_shop_id, source_order_id)
     DO UPDATE SET order_number = EXCLUDED.order_number,
                   customer_name = EXCLUDED.customer_name,
                   customer_phone = EXCLUDED.customer_phone,
                   customer_email = EXCLUDED.customer_email,
                   total_amount = EXCLUDED.total_amount,
                   payment_status = EXCLUDED.payment_status,
                   payment_status_reason = EXCLUDED.payment_status_reason,
                   pancake_status = EXCLUDED.pancake_status,
                   pancake_status_label = EXCLUDED.pancake_status_label,
                   pancake_inserted_at = EXCLUDED.pancake_inserted_at,
                   pancake_updated_at = EXCLUDED.pancake_updated_at,
                   raw_json = EXCLUDED.raw_json,
                   last_synced_at = now(),
                   updated_at = now()
     RETURNING id, tenant_id, tenant_shop_id, source_order_id, order_number, payment_status, raw_json`,
    [
      tenantId,
      shopId,
      sourceOrderId,
      stringValue(order.display_id ?? order.order_number ?? order.orderNumber ?? sourceOrderId),
      buyer.name,
      buyer.phone,
      buyer.email,
      payment.totalPriceAfterDiscount || payment.totalPrice || null,
      paymentDecision.status,
      paymentDecision.reason,
      stringValue(order.status ?? order.status_id ?? order.updateStatus),
      stringValue(order.status_name ?? order.status ?? order.status_id),
      dateValue(order.inserted_at ?? order.created_at),
      dateValue(order.updated_at ?? order.modified_at),
      order
    ]
  );
  return rows[0]!;
}

export async function hasPancakeOrderSnapshots(tenantId: string, shopId: string): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM pancake_order_snapshots WHERE tenant_id = $1 AND tenant_shop_id = $2 LIMIT 1) AS exists`,
    [tenantId, shopId]
  );
  return Boolean(rows[0]?.exists);
}

export async function listPancakeOrderSnapshots(input: {
  tenantId: string;
  shopId: string;
  page: number;
  pageSize: number;
  search?: string;
  paidOnly?: boolean;
  paymentStatus?: 'paid' | 'unpaid' | 'unknown';
  pancakeStatus?: string;
  updatedFromUnix?: number;
  updatedToUnix?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ snapshots: PancakeOrderSnapshot[]; totalEntries: number; totalPages: number }> {
  const conditions = ['tenant_id = $1', 'tenant_shop_id = $2'];
  const params: unknown[] = [input.tenantId, input.shopId];
  if (input.paidOnly) {
    conditions.push(`payment_status = 'paid'`);
  } else if (input.paymentStatus) {
    params.push(input.paymentStatus);
    conditions.push(`payment_status = $${params.length}`);
  }
  if (input.pancakeStatus) {
    params.push(input.pancakeStatus);
    conditions.push(`pancake_status = $${params.length}`);
  }
  if (input.updatedFromUnix !== undefined) {
    params.push(input.updatedFromUnix);
    conditions.push(`pancake_updated_at >= to_timestamp($${params.length})`);
  } else if (input.dateFrom) {
    params.push(input.dateFrom);
    conditions.push(`pancake_updated_at >= $${params.length}::timestamptz`);
  }
  if (input.updatedToUnix !== undefined) {
    params.push(input.updatedToUnix);
    conditions.push(`pancake_updated_at <= to_timestamp($${params.length})`);
  } else if (input.dateTo) {
    params.push(input.dateTo);
    conditions.push(`pancake_updated_at <= $${params.length}::timestamptz`);
  }
  if (input.search) {
    params.push(`%${input.search}%`);
    conditions.push(`(source_order_id ILIKE $${params.length} OR order_number ILIKE $${params.length} OR customer_name ILIKE $${params.length} OR customer_phone ILIKE $${params.length})`);
  }

  const where = conditions.join(' AND ');
  const countRows = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM pancake_order_snapshots WHERE ${where}`, params);
  const totalEntries = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.ceil(totalEntries / Math.max(input.pageSize, 1));
  params.push(input.pageSize, (input.page - 1) * input.pageSize);
  const snapshots = await query<PancakeOrderSnapshot>(
    `SELECT id, tenant_id, tenant_shop_id, source_order_id, order_number, payment_status, raw_json
     FROM pancake_order_snapshots
     WHERE ${where}
     ORDER BY pancake_updated_at DESC NULLS LAST, updated_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { snapshots, totalEntries, totalPages };
}

function stringValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function dateValue(value: unknown): string | null {
  const text = stringValue(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
