import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { AppError } from '../../shared/http/errors.js';
import { validateBody, validateParams } from '../../shared/http/validate.js';
import { query } from '../../shared/persistence/db.js';
import { testPancakeConnection } from '../pancake/pancake.service.js';
import { getSepayProviderAccount, getSepayUsage, listSepayProviderAccounts, testSepayConnection } from '../sepay/sepay.service.js';
import { assertShopBelongsToTenant } from '../tenant/tenant-shop.service.js';
import { encryptSecret, hasSecret } from './secret.service.js';

const shopParamsSchema = z.object({ shopId: z.string().uuid() });

const pancakeConfigSchema = z.object({
  shop_id: z.string().min(1),
  shop_name: z.string().min(1).optional(),
  api_key: z.string().min(1).optional(),
  webhook_secret: z.string().min(1).optional(),
  default_order_status_for_issue: z.array(z.number().int()).default([3, 16]),
  allow_create_draft_statuses: z.array(z.number().int()).default([1, 2, 3, 16])
});

const sepayConfigSchema = z.object({
  env: z.enum(['sandbox', 'production']),
  client_id: z.string().min(1).optional(),
  client_secret: z.string().min(1).optional(),
  provider_account_id: z.string().min(1),
  template_code: z.enum(['1', '2']),
  invoice_series: z.string().min(1),
  default_payment_method: z.enum(['TM', 'CK', 'TM/CK', 'KHAC']).default('TM/CK'),
  default_tax_rate: z.union([z.literal(-2), z.literal(-1), z.literal(0), z.literal(5), z.literal(8), z.literal(10)]).default(10)
});

type TenantShopConfigRow = {
  id: string;
  external_shop_id: string;
  shop_name: string;
  status: string;
  config_json: Record<string, unknown>;
  encrypted_secret_json: Record<string, unknown>;
  updated_at: string;
};

type IntegrationConfigRow = {
  id: string;
  tenant_id: string;
  tenant_shop_id: string;
  provider: string;
  scope: string;
  config_json: Record<string, unknown>;
  encrypted_secret_json: Record<string, unknown>;
  updated_at: string;
};

function maskPancakeConfig(row: TenantShopConfigRow) {
  return {
    id: row.id,
    shop_id: row.external_shop_id,
    shop_name: row.shop_name,
    status: row.status,
    config: row.config_json,
    has_api_key: hasSecret(row.encrypted_secret_json.api_key),
    has_webhook_secret: hasSecret(row.encrypted_secret_json.webhook_secret),
    last_updated_at: row.updated_at
  };
}

function maskSepayConfig(row: IntegrationConfigRow | null) {
  if (!row) return null;
  return {
    id: row.id,
    provider: row.provider,
    scope: row.scope,
    config: row.config_json,
    has_client_id: hasSecret(row.encrypted_secret_json.client_id),
    has_client_secret: hasSecret(row.encrypted_secret_json.client_secret),
    last_updated_at: row.updated_at
  };
}

export async function registerIntegrationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/shops/:shopId/pancake/config', { preHandler: requirePermission('integration:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    const shop = await assertShopBelongsToTenant(request.user!.tenantId, shopId);
    return { data: maskPancakeConfig(shop as TenantShopConfigRow) };
  });

  app.put('/v1/shops/:shopId/pancake/config', { preHandler: requirePermission('integration:write') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    await assertShopBelongsToTenant(request.user!.tenantId, shopId);
    const body = validateBody(request, pancakeConfigSchema);
    const encryptedSecrets: Record<string, string> = {};
    if (body.api_key) encryptedSecrets.api_key = encryptSecret(body.api_key);
    if (body.webhook_secret) encryptedSecrets.webhook_secret = encryptSecret(body.webhook_secret);

    const config = {
      base_url: 'https://pos.pages.fm/api/v1',
      shop_id: body.shop_id,
      default_order_status_for_issue: body.default_order_status_for_issue,
      allow_create_draft_statuses: body.allow_create_draft_statuses
    };

    const rows = await query<TenantShopConfigRow>(
      `UPDATE tenant_shops
       SET external_shop_id = $3,
           shop_name = COALESCE($4, shop_name),
           config_json = $5,
           encrypted_secret_json = encrypted_secret_json || $6::jsonb,
           updated_at = now()
       WHERE tenant_id = $1 AND id = $2
       RETURNING id, external_shop_id, shop_name, status, config_json, encrypted_secret_json, updated_at`,
      [request.user!.tenantId, shopId, body.shop_id, body.shop_name ?? null, config, encryptedSecrets]
    );
    return { data: maskPancakeConfig(rows[0]!) };
  });

  app.post('/v1/shops/:shopId/test-pancake', { preHandler: requirePermission('integration:write') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    return { data: await testPancakeConnection(request.user!.tenantId, shopId) };
  });

  app.get('/v1/shops/:shopId/sepay/config', { preHandler: requirePermission('integration:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    await assertShopBelongsToTenant(request.user!.tenantId, shopId);
    const rows = await query<IntegrationConfigRow>(
      `SELECT * FROM integration_configs WHERE tenant_id = $1 AND tenant_shop_id = $2 AND provider = 'sepay' LIMIT 1`,
      [request.user!.tenantId, shopId]
    );
    return { data: maskSepayConfig(rows[0] ?? null) };
  });

  app.put('/v1/shops/:shopId/sepay/config', { preHandler: requirePermission('integration:write') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    await assertShopBelongsToTenant(request.user!.tenantId, shopId);
    const body = validateBody(request, sepayConfigSchema);
    const encryptedSecrets: Record<string, string> = {};
    if (body.client_id) encryptedSecrets.client_id = encryptSecret(body.client_id);
    if (body.client_secret) encryptedSecrets.client_secret = encryptSecret(body.client_secret);
    const config = {
      env: body.env,
      provider_account_id: body.provider_account_id,
      template_code: body.template_code,
      invoice_series: body.invoice_series,
      default_payment_method: body.default_payment_method,
      default_tax_rate: body.default_tax_rate
    };

    const rows = await query<IntegrationConfigRow>(
      `INSERT INTO integration_configs(tenant_id, tenant_shop_id, provider, scope, config_json, encrypted_secret_json)
       VALUES ($1, $2, 'sepay', 'shop', $3, $4)
       ON CONFLICT (tenant_id, tenant_shop_id, provider)
       DO UPDATE SET config_json = EXCLUDED.config_json,
                     encrypted_secret_json = integration_configs.encrypted_secret_json || EXCLUDED.encrypted_secret_json,
                     updated_at = now()
       RETURNING *`,
      [request.user!.tenantId, shopId, config, encryptedSecrets]
    );
    return { data: maskSepayConfig(rows[0]!) };
  });

  app.post('/v1/shops/:shopId/sepay/test', { preHandler: requirePermission('integration:write') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    return { data: await testSepayConnection(request.user!.tenantId, shopId) };
  });

  app.get('/v1/shops/:shopId/sepay/provider-accounts', { preHandler: requirePermission('integration:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    return { data: await listSepayProviderAccounts(request.user!.tenantId, shopId) };
  });

  app.get('/v1/shops/:shopId/sepay/provider-accounts/:providerAccountId', { preHandler: requirePermission('integration:read') }, async request => {
    const { shopId, providerAccountId } = validateParams(request, shopParamsSchema.merge(z.object({ providerAccountId: z.string().min(1) })));
    return { data: await getSepayProviderAccount(request.user!.tenantId, shopId, providerAccountId) };
  });

  app.get('/v1/shops/:shopId/sepay/usage', { preHandler: requirePermission('integration:read') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    return { data: await getSepayUsage(request.user!.tenantId, shopId) };
  });
}
