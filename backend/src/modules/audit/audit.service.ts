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
