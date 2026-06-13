import { query } from '../../shared/persistence/db.js';

export type AuditEntryInput = {
  tenantId: string;
  tenantShopId?: string | null;
  actorUserId?: string | null;
  actorType: 'user' | 'system' | 'worker' | 'webhook';
  action: string;
  resourceType: string;
  resourceId?: string | null;
  permission?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string | null;
};

export const AUDIT_ACTIONS = {
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  INTEGRATION_PANCAKE_CONFIG_UPDATED: 'integration.pancake_config_updated',
  INTEGRATION_SEPAY_CONFIG_UPDATED: 'integration.sepay_config_updated',
  INVOICE_DRAFT_REQUESTED: 'invoice.draft_requested',
  INVOICE_ISSUE_REQUESTED: 'invoice.issue_requested',
  INVOICE_RETRY_REQUESTED: 'invoice.retry_requested',
  INVOICE_DOWNLOAD_REQUESTED: 'invoice.download_requested',
  WEBHOOK_CONFIGURED: 'webhook.configured',
  SHOP_ACCESS_UPDATED: 'shop_access.updated'
} as const;

export async function writeAuditLog(input: AuditEntryInput): Promise<void> {
  await query(
    `INSERT INTO audit_logs(
       tenant_id, tenant_shop_id, actor_user_id, actor_type, action, resource_type,
       resource_id, permission, metadata_json, correlation_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      input.tenantId,
      input.tenantShopId ?? null,
      input.actorUserId ?? null,
      input.actorType,
      input.action,
      input.resourceType,
      input.resourceId ?? null,
      input.permission ?? null,
      input.metadata ?? {},
      input.correlationId ?? null
    ]
  );
}

export async function tryWriteAuditLog(input: AuditEntryInput): Promise<void> {
  try {
    await writeAuditLog({ ...input, metadata: sanitizeAuditMetadata(input.metadata ?? {}) });
  } catch (error) {
    // Audit must never leak secrets or break a successful user action.
    console.warn('[audit] failed to write audit log', {
      action: input.action,
      resourceType: input.resourceType,
      tenantId: input.tenantId,
      tenantShopId: input.tenantShopId ?? null,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorCode: typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : undefined
    });
  }
}

function sanitizeAuditMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (lower.includes('secret') || lower.includes('token') || lower.includes('password') || lower.includes('api_key') || lower.includes('client_secret')) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
