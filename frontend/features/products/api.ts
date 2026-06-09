import { cookies } from 'next/headers';
import { apiFetchWithCookie } from '@/lib/api/client';

export type ProductRow = {
  id: string;
  source_product_code: string;
  product_name: string;
  product_type: string;
  default_invoice_unit: string;
  group_name: string | null;
  status: string;
  source: 'fintab_export' | 'pancake_pos';
};

async function cookieHeader() {
  return (await cookies()).toString();
}

export async function listProducts(query?: { search?: string; status?: string; group?: string }) {
  const params = new URLSearchParams();
  if (query?.search) params.set('search', query.search);
  if (query?.status) params.set('status', query.status);
  if (query?.group) params.set('group', query.group);
  const suffix = params.toString() ? `?${params}` : '';
  return apiFetchWithCookie<ProductRow[]>(`/v1/products${suffix}`, await cookieHeader(), { cache: 'no-store' });
}

export async function getProductTaxProfile(productId: string) {
  return apiFetchWithCookie<Record<string, unknown> | null>(`/v1/products/${productId}/tax-profile`, await cookieHeader(), { cache: 'no-store' });
}

export type ProductSyncResult = {
  synced: number;
  skipped: number;
  failed: number;
  totalEntries: number;
  totalPages: number;
  errors: Array<{ code: string; message: string }>;
};

export async function syncPancakeProducts(shopId: string) {
  return apiFetchWithCookie<ProductSyncResult>(`/v1/products/sync/pancake`, await cookieHeader(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shopId }),
    cache: 'no-store'
  });
}
