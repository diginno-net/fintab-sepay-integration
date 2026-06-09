import { cookies } from 'next/headers';
import { apiFetchWithCookie } from '@/lib/api/client';

export type TenantShop = {
  id: string;
  tenant_id: string;
  provider: string;
  external_shop_id: string;
  shop_name: string;
  status: string;
  config_json: Record<string, unknown>;
  encrypted_secret_json?: Record<string, unknown>;
};

export type MaskedPancakeConfig = {
  id: string;
  shop_id: string;
  shop_name: string;
  status: string;
  config: Record<string, unknown>;
  has_api_key: boolean;
  has_webhook_secret: boolean;
  last_updated_at: string;
};

export type MaskedSepayConfig = {
  id: string;
  provider: string;
  scope: string;
  config: Record<string, unknown>;
  has_client_id: boolean;
  has_client_secret: boolean;
  last_updated_at: string;
} | null;

export type ShopTaxDefaults = {
  id: string;
  default_tax_rate: number;
  default_invoice_unit: string;
  default_invoice_type: 'gtgt' | 'ban_hang';
  unknown_product_policy: 'warn' | 'block' | 'use_default';
} | null;

async function cookieHeader() {
  return (await cookies()).toString();
}

export async function listTenantShops(): Promise<TenantShop[]> {
  return apiFetchWithCookie<TenantShop[]>('/v1/tenant-shops', await cookieHeader(), { cache: 'no-store' });
}

export async function getPancakeConfig(shopId: string): Promise<MaskedPancakeConfig> {
  return apiFetchWithCookie<MaskedPancakeConfig>(`/v1/shops/${shopId}/pancake/config`, await cookieHeader(), { cache: 'no-store' });
}

export async function getSepayConfig(shopId: string): Promise<MaskedSepayConfig> {
  return apiFetchWithCookie<MaskedSepayConfig>(`/v1/shops/${shopId}/sepay/config`, await cookieHeader(), { cache: 'no-store' });
}

export async function getTaxDefaults(shopId: string): Promise<ShopTaxDefaults> {
  return apiFetchWithCookie<ShopTaxDefaults>(`/v1/shops/${shopId}/tax/defaults`, await cookieHeader(), { cache: 'no-store' });
}
