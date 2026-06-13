import { cookies } from 'next/headers';
import { apiFetchWithCookie } from '@/lib/api/client';

export { extractOrderRows, orderId, orderStatus, orderTotal, orderDate, orderCustomerName } from './order-helpers';

export type OrdersPagination = {
  page: number;
  pageSize: number;
  totalEntries: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type PancakeOrderSyncRun = {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  current_page: number;
  total_pages: number;
  total_entries: number;
  synced_count: number;
  paid_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
};

export type OrdersResponse = {
  source?: 'snapshot' | 'live';
  syncRun?: PancakeOrderSyncRun | null;
  pagination?: OrdersPagination;
  rows?: Array<Record<string, unknown>>;
};

async function cookieHeader() {
  return (await cookies()).toString();
}

export async function listOrders(shopId: string, query?: { status?: string; search?: string; page?: number; pageSize?: number; paidOnly?: boolean }) {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.search) params.set('search', query.search);
  params.set('page', String(query?.page ?? 1));
  params.set('page_size', String(query?.pageSize ?? 100));
  if (query?.paidOnly !== undefined) params.set('paidOnly', String(query.paidOnly));
  const suffix = params.toString() ? `?${params}` : '';
  return apiFetchWithCookie<OrdersResponse>(`/v1/pancake/shops/${shopId}/orders${suffix}`, await cookieHeader(), { cache: 'no-store' });
}

export async function getOrder(shopId: string, orderId: string) {
  return apiFetchWithCookie<unknown>(`/v1/pancake/shops/${shopId}/orders/${orderId}`, await cookieHeader(), { cache: 'no-store' });
}
