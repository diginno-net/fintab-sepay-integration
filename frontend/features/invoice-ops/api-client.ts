'use client';

import { apiFetch } from '@/lib/api/client';

export type InvoiceOrderStatus =
  | 'not_created'
  | 'draft_queued'
  | 'draft_created'
  | 'issue_queued'
  | 'issued'
  | 'failed'
  | 'requires_draft_recreate'
  | 'cancelled'
  | 'processing';

export type InvoiceOrderActions = {
  canEditInvoiceInfo: boolean;
  canCreateDraft: boolean;
  canRecreateDraft: boolean;
  canIssue: boolean;
  canRetry: boolean;
  canRefresh: boolean;
  canDownloadPdf: boolean;
  canDownloadXml: boolean;
};

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

export type InvoiceOrdersResponse = {
  stats: InvoiceOrderStats;
  pagination: InvoiceOrderPagination;
  source: 'snapshot' | 'live';
  syncRun: PancakeOrderSyncRun | null;
  rows: InvoiceOrderRow[];
};

export type PancakeOrderSyncRun = {
  id: string;
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
  created_at: string;
  updated_at: string;
};

export type BulkActionResult = {
  results: Array<{ orderId: string; ok: boolean; invoiceJobId?: string; backgroundJobId?: string; reused?: boolean; message?: string }>;
};

export async function listInvoiceOrdersClient(input: {
  shopId: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  paidOnly?: boolean;
  pancakeStatus?: string;
  completedOnly?: boolean;
  completedDays?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<InvoiceOrdersResponse> {
  const params = new URLSearchParams({ shopId: input.shopId });
  if (input.status && input.status !== 'all') params.set('status', input.status);
  if (input.search) params.set('search', input.search);
  if (input.page) params.set('page', String(input.page));
  if (input.pageSize) params.set('pageSize', String(input.pageSize));
  if (input.paidOnly !== undefined) params.set('paidOnly', String(input.paidOnly));
  if (input.pancakeStatus) params.set('pancakeStatus', input.pancakeStatus);
  if (input.completedOnly !== undefined) params.set('completedOnly', String(input.completedOnly));
  if (input.completedDays) params.set('completedDays', String(input.completedDays));
  if (input.dateFrom) params.set('dateFrom', input.dateFrom);
  if (input.dateTo) params.set('dateTo', input.dateTo);
  return apiFetch<InvoiceOrdersResponse>(`/v1/invoice-orders?${params.toString()}`, { cache: 'no-store' });
}

export function createDraftForOrderClient(shopId: string, orderId: string) {
  return apiFetch<Record<string, unknown>>(`/v1/invoice-orders/${shopId}/${orderId}/create-draft`, {
    method: 'POST',
    body: JSON.stringify({ invoiceType: 'ban_hang' })
  });
}

export function issueOrderInvoiceClient(shopId: string, orderId: string) {
  return apiFetch<Record<string, unknown>>(`/v1/invoice-orders/${shopId}/${orderId}/issue`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export function bulkCreateDraftClient(shopId: string, orderIds: string[]) {
  return apiFetch<BulkActionResult>('/v1/invoice-orders/bulk-create-draft', {
    method: 'POST',
    body: JSON.stringify({ shopId, orderIds, invoiceType: 'ban_hang' })
  });
}

export function bulkCreateDraftByFilterClient(input: {
  shopId: string;
  status?: string;
  search?: string;
  paidOnly?: boolean;
  pancakeStatus?: string;
  completedOnly?: boolean;
  completedDays?: number;
  limit?: number;
}) {
  return apiFetch<BulkActionResult & { totalMatched: number; attempted: number; created: number; skipped: number }>('/v1/invoice-orders/bulk-create-draft-by-filter', {
    method: 'POST',
    body: JSON.stringify({ ...input, invoiceType: 'ban_hang', limit: input.limit ?? 500 })
  });
}

export function bulkIssueClient(shopId: string, orderIds: string[]) {
  return apiFetch<BulkActionResult>('/v1/invoice-orders/bulk-issue', {
    method: 'POST',
    body: JSON.stringify({ shopId, orderIds })
  });
}

export function startPancakeOrderSyncClient(shopId: string, pageSize = 100, options?: { completedOnly?: boolean; completedDays?: number }) {
  return apiFetch<{ syncRun: PancakeOrderSyncRun; jobId: string }>(`/v1/pancake/shops/${shopId}/orders/sync`, {
    method: 'POST',
    body: JSON.stringify({ pageSize, ...options })
  });
}

export function listPancakeOrderSyncRunsClient(shopId: string) {
  return apiFetch<PancakeOrderSyncRun[]>(`/v1/pancake/shops/${shopId}/orders/sync-runs`, { cache: 'no-store' });
}
