'use client';

import { apiFetch } from '@/lib/api/client';

export async function listOrdersClient(shopId: string, query?: { status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.search) params.set('search', query.search);
  const suffix = params.toString() ? `?${params}` : '';
  return apiFetch<unknown>(`/v1/pancake/shops/${shopId}/orders${suffix}`, { cache: 'no-store' });
}

export async function getOrderClient(shopId: string, orderId: string) {
  return apiFetch<unknown>(`/v1/pancake/shops/${shopId}/orders/${orderId}`, { cache: 'no-store' });
}
