import { AppError } from '../../shared/http/errors.js';
import { query } from '../../shared/persistence/db.js';
import { decryptSecret } from '../integrations/secret.service.js';
import { assertShopBelongsToTenant } from '../tenant/tenant-shop.service.js';
import { PancakeApiError, PancakeClient } from './pancake-client.js';

type ShopCredentialsRow = {
  external_shop_id: string;
  config_json: Record<string, unknown>;
  encrypted_secret_json: Record<string, unknown>;
};

export async function pancakeClientForShop(tenantId: string, shopId: string): Promise<PancakeClient> {
  await assertShopBelongsToTenant(tenantId, shopId);
  const rows = await query<ShopCredentialsRow>(
    `SELECT external_shop_id, config_json, encrypted_secret_json
     FROM tenant_shops
     WHERE tenant_id = $1 AND id = $2
     LIMIT 1`,
    [tenantId, shopId]
  );
  const shop = rows[0];
  const encryptedApiKey = shop?.encrypted_secret_json.api_key;
  if (!shop || typeof encryptedApiKey !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'Shop chưa cấu hình Pancake API key', 400, { code: 'SHOP_PANCAKE_CONFIG_REQUIRED' });
  }
  const baseUrl = typeof shop.config_json.base_url === 'string' ? shop.config_json.base_url : undefined;
  const shopExternalId = typeof shop.config_json.shop_id === 'string' ? shop.config_json.shop_id : shop.external_shop_id;
  return new PancakeClient({ baseUrl, shopId: shopExternalId, apiKey: decryptSecret(encryptedApiKey) });
}

export async function testPancakeConnection(tenantId: string, shopId: string): Promise<{ ok: boolean; data?: unknown }> {
  try {
    const client = await pancakeClientForShop(tenantId, shopId);
    return { ok: true, data: await client.testConnection() };
  } catch (error) {
    if (error instanceof PancakeApiError) {
      throw new AppError('VALIDATION_ERROR', 'Pancake connection failed', 400, {
        statusCode: error.statusCode,
        url: error.redactedUrl
      });
    }
    throw error;
  }
}
