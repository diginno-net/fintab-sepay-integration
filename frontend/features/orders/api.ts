import { cookies } from 'next/headers';
import { apiFetchWithCookie } from '@/lib/api/client';

export { extractOrderRows, orderId, orderStatus, orderTotal, orderDate, orderCustomerName } from './order-helpers';

async function cookieHeader() {
  return (await cookies()).toString();
}

export async function listOrders(shopId: string, query?: { status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.search) params.set('search', query.search);
  const suffix = params.toString() ? `?${params}` : '';
  return apiFetchWithCookie<unknown>(`/v1/pancake/shops/${shopId}/orders${suffix}`, await cookieHeader(), { cache: 'no-store' });
}

export async function getOrder(shopId: string, orderId: string) {
  return apiFetchWithCookie<unknown>(`/v1/pancake/shops/${shopId}/orders/${orderId}`, await cookieHeader(), { cache: 'no-store' });
}
