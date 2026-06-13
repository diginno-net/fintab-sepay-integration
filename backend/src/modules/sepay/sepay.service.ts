import { AppError } from '../../shared/http/errors.js';
import { query } from '../../shared/persistence/db.js';
import { decryptSecret } from '../integrations/secret.service.js';
import { assertShopBelongsToTenant } from '../tenant/tenant-shop.service.js';
import { SepayEInvoiceClient, type SepayEnv } from './sepay-einvoice-client.js';
import { humanizeSepayError, SepayError } from './sepay.errors.js';
import { clearCachedToken, getCachedToken, setCachedToken } from './sepay-token-cache.js';

type SepayConfigRow = {
  tenant_id: string;
  tenant_shop_id: string;
  config_json: {
    env?: SepayEnv;
    provider_account_id?: string;
    template_code?: string;
    invoice_series?: string;
    default_payment_method?: string;
    default_tax_rate?: number;
    dry_run?: boolean;
    auto_create_invoice?: boolean;
    auto_issue_invoice?: boolean;
    require_accountant_confirmation_before_auto_issue?: boolean;
  };
  encrypted_secret_json: Record<string, unknown>;
};

export type SepayShopConfig = {
  provider_account_id: string | null;
  template_code: string | null;
  invoice_series: string | null;
  default_payment_method: string | null;
  default_tax_rate: number | null;
  has_credentials: boolean;
  env: SepayEnv;
  automation: SepayAutomationSettings;
};

export type SepayAutomationSettings = {
  dryRun: boolean;
  autoCreateInvoice: boolean;
  autoIssueInvoice: boolean;
  requireAccountantConfirmationBeforeAutoIssue: boolean;
};

export type SepayContext = {
  config: SepayConfigRow;
  clientId: string;
  clientSecret: string;
  env: SepayEnv;
  client: SepayEInvoiceClient;
};

export async function sepayContextForShop(tenantId: string, shopId: string): Promise<SepayContext> {
  await assertShopBelongsToTenant(tenantId, shopId);
  const rows = await query<SepayConfigRow>(
    `SELECT tenant_id, tenant_shop_id, config_json, encrypted_secret_json
     FROM integration_configs
     WHERE tenant_id = $1 AND tenant_shop_id = $2 AND provider = 'sepay'
     LIMIT 1`,
    [tenantId, shopId]
  );
  const config = rows[0];
  const encryptedClientId = config?.encrypted_secret_json.client_id;
  const encryptedClientSecret = config?.encrypted_secret_json.client_secret;
  if (!config || typeof encryptedClientId !== 'string' || typeof encryptedClientSecret !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'Shop này chưa cấu hình tài khoản SePay', 400, { code: 'SHOP_SEPAY_CONFIG_REQUIRED' });
  }

  const clientId = decryptSecret(encryptedClientId);
  const clientSecret = decryptSecret(encryptedClientSecret);
  const env = config.config_json.env ?? 'sandbox';
  const cachedToken = await getCachedToken({ tenantId, tenantShopId: shopId, env, clientId });
  const client = new SepayEInvoiceClient({ env, clientId, clientSecret, accessToken: cachedToken ?? undefined });

  if (!cachedToken) {
    const token = await client.getToken();
    await setCachedToken({ tenantId, tenantShopId: shopId, env, clientId }, token.access_token, token.expires_in ?? 3600);
  }

  return { config, clientId, clientSecret, env, client };
}

export async function withSepayRetry<T>(tenantId: string, shopId: string, operation: (client: SepayEInvoiceClient) => Promise<T>): Promise<T> {
  try {
    const context = await sepayContextForShop(tenantId, shopId);
    return await operation(context.client);
  } catch (error) {
    if (error instanceof SepayError && error.statusCode === 401) {
      const context = await sepayContextForShop(tenantId, shopId).catch(() => null);
      if (!context) {
        throw new AppError('VALIDATION_ERROR', humanizeSepayError(error), 400, { code: error.code, provider: 'sepay', details: error.details });
      }
      await clearCachedToken({ tenantId, tenantShopId: shopId, env: context.env, clientId: context.clientId });
      const freshContext = await sepayContextForShop(tenantId, shopId);
      return operation(freshContext.client);
    }
    if (error instanceof SepayError) {
      throw new AppError('VALIDATION_ERROR', humanizeSepayError(error), 400, { code: error.code, provider: 'sepay', details: error.details });
    }
    throw error;
  }
}

export async function testSepayConnection(tenantId: string, shopId: string): Promise<{
  ok: boolean;
  providerAccounts?: unknown;
  env?: string;
  error?: { code: string; message: string };
}> {
  try {
    const context = await sepayContextForShop(tenantId, shopId);
    const providerAccounts = await context.client.listProviderAccounts();
    return { ok: true, providerAccounts, env: context.env };
  } catch (error) {
    if (error instanceof SepayError) {
      return { ok: false, error: { code: error.code, message: humanizeSepayError(error) } };
    }
    if (error instanceof AppError) {
      return { ok: false, error: { code: error.code, message: error.message } };
    }
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: String(error) } };
  }
}

export function listSepayProviderAccounts(tenantId: string, shopId: string): Promise<unknown> {
  return withSepayRetry(tenantId, shopId, client => client.listProviderAccounts());
}

export function getSepayProviderAccount(tenantId: string, shopId: string, accountId: string): Promise<unknown> {
  return withSepayRetry(tenantId, shopId, client => client.getProviderAccount(accountId));
}

export function getSepayUsage(tenantId: string, shopId: string): Promise<unknown> {
  return withSepayRetry(tenantId, shopId, client => client.checkUsage());
}

export async function getSepayConfigForShop(tenantId: string, shopId: string): Promise<SepayShopConfig> {
  await assertShopBelongsToTenant(tenantId, shopId);
  const rows = await query<SepayConfigRow>(
    `SELECT tenant_id, tenant_shop_id, config_json, encrypted_secret_json
     FROM integration_configs
     WHERE tenant_id = $1 AND tenant_shop_id = $2 AND provider = 'sepay'
     LIMIT 1`,
    [tenantId, shopId]
  );
  const config = rows[0];
  const hasCredentials =
    typeof config?.encrypted_secret_json?.client_id === 'string' &&
    typeof config?.encrypted_secret_json?.client_secret === 'string';
  const cfg = config?.config_json ?? {};
  return {
    provider_account_id: typeof cfg.provider_account_id === 'string' ? cfg.provider_account_id : null,
    template_code: typeof cfg.template_code === 'string' ? cfg.template_code : null,
    invoice_series: typeof cfg.invoice_series === 'string' ? cfg.invoice_series : null,
    default_payment_method: typeof cfg.default_payment_method === 'string' ? cfg.default_payment_method : null,
    default_tax_rate: typeof cfg.default_tax_rate === 'number' ? cfg.default_tax_rate : null,
    has_credentials: hasCredentials,
    env: cfg.env ?? 'sandbox',
    automation: normalizeSepayAutomationSettings(cfg)
  };
}

export async function getSepayAutomationSettings(tenantId: string, shopId: string): Promise<SepayAutomationSettings> {
  const config = await getSepayConfigForShop(tenantId, shopId);
  return config.automation;
}

export function normalizeSepayAutomationSettings(config: Record<string, unknown> | null | undefined): SepayAutomationSettings {
  return {
    dryRun: typeof config?.dry_run === 'boolean' ? config.dry_run : true,
    autoCreateInvoice: typeof config?.auto_create_invoice === 'boolean' ? config.auto_create_invoice : false,
    autoIssueInvoice: typeof config?.auto_issue_invoice === 'boolean' ? config.auto_issue_invoice : false,
    requireAccountantConfirmationBeforeAutoIssue:
      typeof config?.require_accountant_confirmation_before_auto_issue === 'boolean'
        ? config.require_accountant_confirmation_before_auto_issue
        : true
  };
}

export async function assertSepayReadyForIssue(tenantId: string, shopId: string): Promise<void> {
  await assertShopBelongsToTenant(tenantId, shopId);
  const rows = await query<SepayConfigRow>(
    `SELECT tenant_id, tenant_shop_id, config_json, encrypted_secret_json
     FROM integration_configs
     WHERE tenant_id = $1 AND tenant_shop_id = $2 AND provider = 'sepay'
     LIMIT 1`,
    [tenantId, shopId]
  );
  const config = rows[0];
  const cfg = config?.config_json ?? {};
  const encryptedClientId = config?.encrypted_secret_json.client_id;
  const encryptedClientSecret = config?.encrypted_secret_json.client_secret;
  if (!config || typeof encryptedClientId !== 'string' || typeof encryptedClientSecret !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'Shop này chưa cấu hình tài khoản SePay để phát hành hóa đơn.', 400, { code: 'SEPAY_MISSING_CREDENTIALS' });
  }
  if (!cfg.provider_account_id || !cfg.template_code || !cfg.invoice_series) {
    throw new AppError('VALIDATION_ERROR', 'Cấu hình SePay thiếu tài khoản nhà cung cấp, mẫu hoặc ký hiệu hóa đơn.', 400, { code: 'SEPAY_CONFIG_INCOMPLETE' });
  }
  const clientId = decryptSecret(encryptedClientId);
  if (cfg.env === 'production' && clientId.startsWith('EINV-TEST-')) {
    throw new AppError('VALIDATION_ERROR', 'Client ID sandbox không được dùng để phát hành hóa đơn production.', 400, { code: 'SEPAY_INVALID_PRODUCTION_CLIENT_ID' });
  }
}
