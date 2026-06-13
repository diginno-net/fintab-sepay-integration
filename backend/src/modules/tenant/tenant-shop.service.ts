import { AppError } from '../../shared/http/errors.js';
import { query } from '../../shared/persistence/db.js';
import type { PancakePaymentPolicyConfig } from '../pancake/pancake-payment-policy.js';

export type TenantShop = {
  id: string;
  tenant_id: string;
  provider: string;
  external_shop_id: string;
  shop_name: string;
  status: string;
  config_json: Record<string, unknown>;
  encrypted_secret_json: Record<string, unknown>;
  updated_at: string;
};

export async function listTenantShops(tenantId: string): Promise<TenantShop[]> {
  return query<TenantShop>('SELECT * FROM tenant_shops WHERE tenant_id = $1 ORDER BY created_at DESC', [tenantId]);
}

export async function assertShopBelongsToTenant(tenantId: string, shopId: string): Promise<TenantShop> {
  const rows = await query<TenantShop>('SELECT * FROM tenant_shops WHERE tenant_id = $1 AND id = $2 LIMIT 1', [tenantId, shopId]);
  const shop = rows[0];
  if (!shop) throw new AppError('NOT_FOUND', 'Shop not found', 404);
  return shop;
}

export async function getShopPaymentPolicy(tenantId: string, shopId: string): Promise<PancakePaymentPolicyConfig> {
  const shop = await assertShopBelongsToTenant(tenantId, shopId);
  const raw = shop.config_json.paymentPolicy;
  if (!raw || typeof raw !== 'object') return { mode: 'strict' };
  const policy = raw as Record<string, unknown>;
  const mode = policy.mode === 'hybrid' || policy.mode === 'completed_status_as_paid' || policy.mode === 'strict'
    ? policy.mode
    : 'strict';
  const completedStatuses = Array.isArray(policy.completedStatuses)
    ? policy.completedStatuses.filter(value => typeof value === 'string' || typeof value === 'number')
    : [];
  return { mode, completedStatuses };
}
