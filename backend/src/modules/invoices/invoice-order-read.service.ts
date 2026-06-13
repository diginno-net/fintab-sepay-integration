import { normalizeBuyer, normalizePayment } from '../pancake/pancake-normalizers.js';
import { buildOrderListQuery, type PancakeOrderFilterInput } from '../pancake/pancake-order-filter.js';
import { parsePancakeOrderPage } from '../pancake/pancake-order-pagination.js';
import { getPancakePaymentStatus, type PancakePaymentPolicyConfig } from '../pancake/pancake-payment-policy.js';
import { hasPancakeOrderSnapshots, latestPancakeOrderSyncRun, listPancakeOrderSnapshots, type PancakeOrderSyncRun } from '../pancake/pancake-order-sync.service.js';
import { pancakeClientForShop } from '../pancake/pancake.service.js';
import { getShopPaymentPolicy } from '../tenant/tenant-shop.service.js';
import type { InvoiceBuyerRequest } from './invoice-buyer-request.schema.js';
import { listInvoiceBuyerRequestsByOrders } from './invoice-buyer-request.service.js';
import { computeInvoiceRequestHashFromObject, listInvoiceJobsByOrders, type InvoiceJob } from './invoice-job.service.js';
import { computeInvoiceOrderActions, computeInvoiceOrderStatus, invoiceOrderStatusLabel, type InvoiceOrderActions, type InvoiceOrderStatus } from './invoice-order-status.js';

export type InvoiceOrderRow = {
  orderId: string;
  orderNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  totalAmount: number | null;
  totalFormatted: string;
  paymentStatus: 'paid' | 'paid_by_policy' | 'unpaid' | 'unknown';
  paymentStatusLabel: string;
  pancakeStatus: string | number | null;
  pancakeStatusLabel: string;
  invoiceStatus: InvoiceOrderStatus;
  invoiceStatusLabel: string;
  invoiceJobId: string | null;
  invoiceNumber: string | null;
  hasBuyerRequest: boolean;
  buyerRequestSource: 'saved' | 'pancake' | null;
  requiresDraftRecreate: boolean;
  eligibleForDraft: boolean;
  eligibleForIssue: boolean;
  eligibleForDownload: boolean;
  eligibleForRetry: boolean;
  actions: InvoiceOrderActions;
  errorMessage: string | null;
  updatedAt: string | null;
};

export type InvoiceOrderStats = {
  totalOrders: number;
  notCreated: number;
  draftCreated: number;
  issued: number;
  processing: number;
  failed: number;
  requiresAttention: number;
};

export type InvoiceOrderPagination = {
  page: number;
  pageSize: number;
  totalEntries: number;
  totalPages: number;
  hasNextPage: boolean;
};

export async function listInvoiceOrderRows(input: {
  tenantId: string;
  shopId: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  paidOnly?: boolean;
  pancakeStatus?: string;
  filterStatus?: Array<string | number>;
  completedOnly?: boolean;
  completedDays?: number;
  updateStatus?: string;
  startDateTime?: number;
  endDateTime?: number;
  optionSort?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ stats: InvoiceOrderStats; pagination: InvoiceOrderPagination; syncRun: PancakeOrderSyncRun | null; source: 'snapshot' | 'live'; rows: InvoiceOrderRow[] }> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const syncRun = await latestPancakeOrderSyncRun(input.tenantId, input.shopId);
  const paymentPolicy = await getShopPaymentPolicy(input.tenantId, input.shopId);
  const orderFilter = buildInvoiceOrderFilter(input);
  const pancakeQuery = buildOrderListQuery({ ...orderFilter, page, page_number: page, page_size: pageSize });
  if (await hasPancakeOrderSnapshots(input.tenantId, input.shopId)) {
    const pageResult = await listPancakeOrderSnapshots({
      tenantId: input.tenantId,
      shopId: input.shopId,
      page,
      pageSize,
      search: input.search,
      paidOnly: input.paidOnly,
      pancakeStatus: snapshotPancakeStatus(orderFilter),
      updatedFromUnix: typeof pancakeQuery.startDateTime === 'number' ? pancakeQuery.startDateTime : undefined,
      updatedToUnix: typeof pancakeQuery.endDateTime === 'number' ? pancakeQuery.endDateTime : undefined,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo
    });
    const orders = pageResult.snapshots.map(snapshot => snapshot.raw_json);
    const rows = await buildRows(input.tenantId, input.shopId, orders, paymentPolicy);
    const filteredRows = input.status && input.status !== 'all'
      ? rows.filter(row => statusMatches(row, input.status!))
      : rows;
    return {
      stats: { ...computeStats(rows), totalOrders: pageResult.totalEntries },
      pagination: {
        page,
        pageSize,
        totalEntries: pageResult.totalEntries,
        totalPages: pageResult.totalPages,
        hasNextPage: page < pageResult.totalPages
      },
      syncRun,
      source: 'snapshot',
      rows: filteredRows
    };
  }

  const pancakeClient = await pancakeClientForShop(input.tenantId, input.shopId);
  const raw = await pancakeClient.listOrders(pancakeQuery);
  const parsed = parsePancakeOrderPage(raw, { page, pageSize });
  const orders = input.paidOnly
    ? parsed.orders.filter(order => ['paid', 'paid_by_policy'].includes(getPancakePaymentStatus(order, paymentPolicy).status))
    : parsed.orders;
  const rows = await buildRows(input.tenantId, input.shopId, orders, paymentPolicy);
  const filteredRows = input.status && input.status !== 'all'
    ? rows.filter(row => statusMatches(row, input.status!))
    : rows;
  return { stats: { ...computeStats(rows), totalOrders: parsed.pagination.totalEntries }, pagination: parsed.pagination, syncRun, source: 'live', rows: filteredRows };
}

function buildInvoiceOrderFilter(input: {
  search?: string;
  pancakeStatus?: string;
  filterStatus?: Array<string | number>;
  completedOnly?: boolean;
  completedDays?: number;
  updateStatus?: string;
  startDateTime?: number;
  endDateTime?: number;
  optionSort?: string;
  dateFrom?: string;
  dateTo?: string;
}): PancakeOrderFilterInput {
  return {
    search: input.search,
    pancakeStatus: input.pancakeStatus,
    filterStatus: input.filterStatus,
    completedOnly: input.completedOnly,
    completedDays: input.completedDays,
    updateStatus: input.updateStatus,
    startDateTime: input.startDateTime,
    endDateTime: input.endDateTime,
    optionSort: input.optionSort,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo
  };
}

function snapshotPancakeStatus(input: PancakeOrderFilterInput): string | undefined {
  if (input.completedOnly) return '3';
  if (input.filterStatus?.length === 1) return String(input.filterStatus[0]);
  return input.pancakeStatus === undefined ? undefined : String(input.pancakeStatus);
}

async function buildRows(tenantId: string, shopId: string, orders: Array<Record<string, unknown>>, paymentPolicy: PancakePaymentPolicyConfig): Promise<InvoiceOrderRow[]> {
  const orderIds = orders.map(orderId).filter(id => id !== 'unknown');
  const [jobs, requests] = await Promise.all([
    listInvoiceJobsByOrders(tenantId, shopId, orderIds),
    listInvoiceBuyerRequestsByOrders(tenantId, shopId, orderIds)
  ]);
  const jobByOrder = new Map(jobs.map(job => [job.source_order_id, job]));
  const requestByOrder = new Map(requests.map(request => [request.sourceOrderId, request]));
  return orders.map(order => buildRow(order, jobByOrder.get(orderId(order)) ?? null, requestByOrder.get(orderId(order)) ?? null, paymentPolicy));
}

function buildRow(order: Record<string, unknown>, job: InvoiceJob | null, request: InvoiceBuyerRequest | null, paymentPolicy: PancakePaymentPolicyConfig): InvoiceOrderRow {
  const id = orderId(order);
  const buyer = normalizeBuyer(order);
  const payment = normalizePayment(order);
  const requiresDraftRecreate = computeRequiresDraftRecreate(job, request);
  const invoiceStatus = computeInvoiceOrderStatus(job, requiresDraftRecreate);
  const actions = computeInvoiceOrderActions(invoiceStatus, job);
  const paymentStatus = getPancakePaymentStatus(order, paymentPolicy).status;
  const paymentEligible = paymentStatus === 'paid' || paymentStatus === 'paid_by_policy';
  return {
    orderId: id,
    orderNumber: stringValue(order.display_id ?? order.order_number ?? order.orderNumber ?? id),
    customerName: buyer.name,
    customerEmail: buyer.email,
    customerPhone: buyer.phone,
    totalAmount: payment.totalPriceAfterDiscount || payment.totalPrice || null,
    totalFormatted: formatCurrency(payment.totalPriceAfterDiscount || payment.totalPrice),
    paymentStatus,
    paymentStatusLabel: paymentStatus === 'paid' ? 'Đã thanh toán' : paymentStatus === 'paid_by_policy' ? 'Đủ điều kiện theo trạng thái đơn' : paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Không rõ',
    pancakeStatus: order.status_name ? String(order.status_name) : numberOrString(order.status ?? order.status_id),
    pancakeStatusLabel: String(order.status_name ?? order.status ?? order.status_id ?? 'Không rõ'),
    invoiceStatus,
    invoiceStatusLabel: invoiceOrderStatusLabel(invoiceStatus),
    invoiceJobId: job?.id ?? null,
    invoiceNumber: job?.invoice_number ?? null,
    hasBuyerRequest: Boolean(request),
    buyerRequestSource: request ? 'saved' : 'pancake',
    requiresDraftRecreate,
    eligibleForDraft: paymentEligible && (actions.canCreateDraft || actions.canRecreateDraft),
    eligibleForIssue: actions.canIssue,
    eligibleForDownload: actions.canDownloadPdf || actions.canDownloadXml,
    eligibleForRetry: actions.canRetry,
    actions,
    errorMessage: extractErrorMessage(job?.error_json),
    updatedAt: job?.updated_at ?? null
  };
}

function computeRequiresDraftRecreate(job: InvoiceJob | null, request: InvoiceBuyerRequest | null): boolean {
  if (!job || !request || !job.invoice_request_hash || !job.invoice_buyer_request_snapshot_json) return Boolean(job?.requires_draft_recreate);
  const currentHash = computeInvoiceRequestHashFromObject({
    buyerType: request.buyerType,
    taxCode: request.taxCode,
    legalName: request.legalName,
    buyerUnitName: request.buyerUnitName,
    invoiceAddress: request.invoiceAddress,
    identityNumber: request.identityNumber
  });
  return currentHash !== job.invoice_request_hash || Boolean(job.requires_draft_recreate);
}

function computeStats(rows: InvoiceOrderRow[]): InvoiceOrderStats {
  return {
    totalOrders: rows.length,
    notCreated: rows.filter(row => row.invoiceStatus === 'not_created').length,
    draftCreated: rows.filter(row => row.invoiceStatus === 'draft_created' || row.invoiceStatus === 'requires_draft_recreate').length,
    issued: rows.filter(row => row.invoiceStatus === 'issued').length,
    processing: rows.filter(row => ['draft_queued', 'issue_queued', 'processing'].includes(row.invoiceStatus)).length,
    failed: rows.filter(row => row.invoiceStatus === 'failed').length,
    requiresAttention: rows.filter(row => row.invoiceStatus === 'failed' || row.invoiceStatus === 'requires_draft_recreate').length
  };
}

function statusMatches(row: InvoiceOrderRow, status: string): boolean {
  if (status === 'requires_attention') return row.invoiceStatus === 'failed' || row.invoiceStatus === 'requires_draft_recreate';
  if (status === 'processing') return ['draft_queued', 'issue_queued', 'processing'].includes(row.invoiceStatus);
  return row.invoiceStatus === status;
}

function orderId(order: Record<string, unknown>): string {
  return String(order.id ?? order.order_id ?? order.orderId ?? 'unknown');
}

function formatCurrency(value: number): string {
  return Number.isFinite(value) ? `${value.toLocaleString('vi-VN')} VND` : '0 VND';
}

function stringValue(value: unknown): string | null {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function numberOrString(value: unknown): string | number | null {
  if (typeof value === 'number' || typeof value === 'string') return value;
  return null;
}

function extractErrorMessage(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    return stringValue(record.message ?? record.error ?? JSON.stringify(record));
  }
  return stringValue(value);
}
