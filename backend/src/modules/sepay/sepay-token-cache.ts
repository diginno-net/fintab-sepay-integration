import { createHash } from 'node:crypto';
import { query } from '../../shared/persistence/db.js';
import { decryptSecret, encryptSecret } from '../integrations/secret.service.js';

export type TokenCacheKey = {
  tenantId: string;
  tenantShopId: string;
  env: 'sandbox' | 'production';
  clientId: string;
};

type TokenRow = {
  encrypted_access_token: string;
  expires_at: string;
};

export function hashClientId(clientId: string): string {
  return createHash('sha256').update(clientId).digest('hex');
}

export async function getCachedToken(key: TokenCacheKey): Promise<string | null> {
  const rows = await query<TokenRow>(
    `SELECT encrypted_access_token, expires_at
     FROM sepay_token_cache
     WHERE tenant_id = $1 AND tenant_shop_id = $2 AND env = $3 AND client_id_hash = $4
       AND expires_at > now() + interval '5 minutes'
     LIMIT 1`,
    [key.tenantId, key.tenantShopId, key.env, hashClientId(key.clientId)]
  );
  const row = rows[0];
  return row ? decryptSecret(row.encrypted_access_token) : null;
}

export async function setCachedToken(key: TokenCacheKey, accessToken: string, expiresInSeconds: number): Promise<void> {
  await query(
    `INSERT INTO sepay_token_cache(tenant_id, tenant_shop_id, env, client_id_hash, encrypted_access_token, expires_at)
     VALUES ($1, $2, $3, $4, $5, now() + ($6::text || ' seconds')::interval)
     ON CONFLICT (tenant_id, tenant_shop_id, env, client_id_hash)
     DO UPDATE SET encrypted_access_token = EXCLUDED.encrypted_access_token,
                   expires_at = EXCLUDED.expires_at,
                   updated_at = now()`,
    [key.tenantId, key.tenantShopId, key.env, hashClientId(key.clientId), encryptSecret(accessToken), expiresInSeconds]
  );
}

export async function clearCachedToken(key: TokenCacheKey): Promise<void> {
  await query(
    `DELETE FROM sepay_token_cache
     WHERE tenant_id = $1 AND tenant_shop_id = $2 AND env = $3 AND client_id_hash = $4`,
    [key.tenantId, key.tenantShopId, key.env, hashClientId(key.clientId)]
  );
}
