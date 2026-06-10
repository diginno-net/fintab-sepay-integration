'use client';

import { apiFetch } from '@/lib/api/client';
import type { TenantShop, MaskedPancakeConfig, MaskedSepayConfig, ShopTaxDefaults } from '@/features/shops/api';

export async function listTenantShopsClient(): Promise<TenantShop[]> {
  return apiFetch<TenantShop[]>('/v1/tenant-shops', { cache: 'no-store' });
}

export async function getPancakeConfigClient(shopId: string): Promise<MaskedPancakeConfig> {
  return apiFetch<MaskedPancakeConfig>(`/v1/shops/${shopId}/pancake/config`, { cache: 'no-store' });
}

export async function getSepayConfigClient(shopId: string): Promise<MaskedSepayConfig> {
  return apiFetch<MaskedSepayConfig>(`/v1/shops/${shopId}/sepay/config`, { cache: 'no-store' });
}

export async function getTaxDefaultsClient(shopId: string): Promise<ShopTaxDefaults> {
  return apiFetch<ShopTaxDefaults>(`/v1/shops/${shopId}/tax/defaults`, { cache: 'no-store' });
}
