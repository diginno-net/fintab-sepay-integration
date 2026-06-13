import { AppError } from '../../shared/http/errors.js';
import { query } from '../../shared/persistence/db.js';
import type { TenantShop } from './tenant-shop.service.js';
import { hasShopAction, type ShopAccessLevel, type ShopAction } from './shop-access-policy.js';

export type AccessibleShop = TenantShop & {
  access_level: ShopAccessLevel;
  is_default: boolean;
  has_pancake_config?: boolean;
  has_sepay_config?: boolean;
};

export type UserShopAccessSummary = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  shops: Array<{ id: string; name: string; isDefault: boolean; accessLevel: string }>;
};

export type ReplaceUserShopAccessInput = {
  tenantId: string;
  targetUserId: string;
  shops: Array<{ shopId: string; accessLevel: ShopAccessLevel }>;
  defaultShopId: string | null;
};

export async function listAccessibleShops(input: { tenantId: string; userId: string }): Promise<AccessibleShop[]> {
  return query<AccessibleShop>(
    `SELECT ts.*,
            usa.access_level,
            usa.is_default,
            (ts.encrypted_secret_json ? 'api_key') AS has_pancake_config,
            EXISTS (
              SELECT 1 FROM integration_configs ic
              WHERE ic.tenant_shop_id = ts.id AND ic.provider = 'sepay'
            ) AS has_sepay_config
     FROM tenant_shops ts
     JOIN user_shop_access usa
       ON usa.tenant_id = ts.tenant_id
      AND usa.tenant_shop_id = ts.id
     WHERE usa.tenant_id = $1 AND usa.user_id = $2
     ORDER BY usa.is_default DESC, ts.created_at ASC, ts.id ASC`,
    [input.tenantId, input.userId]
  );
}

export async function accessibleShopIds(input: { tenantId: string; userId: string }): Promise<string[]> {
  const rows = await query<{ tenant_shop_id: string }>(
    `SELECT tenant_shop_id
     FROM user_shop_access
     WHERE tenant_id = $1 AND user_id = $2
     ORDER BY is_default DESC, created_at ASC`,
    [input.tenantId, input.userId]
  );
  return rows.map(row => row.tenant_shop_id);
}

export async function assertUserCanAccessShop(input: { tenantId: string; userId: string; shopId: string }): Promise<AccessibleShop> {
  const rows = await query<AccessibleShop>(
    `SELECT ts.*, usa.access_level, usa.is_default
     FROM tenant_shops ts
     JOIN user_shop_access usa
       ON usa.tenant_id = ts.tenant_id
      AND usa.tenant_shop_id = ts.id
     WHERE usa.tenant_id = $1 AND usa.user_id = $2 AND usa.tenant_shop_id = $3
     LIMIT 1`,
    [input.tenantId, input.userId, input.shopId]
  );
  const shop = rows[0];
  if (!shop) throw new AppError('FORBIDDEN', 'You do not have access to this shop', 403, { shopId: input.shopId });
  return shop;
}

export async function assertUserCanAccessShopForAction(input: { tenantId: string; userId: string; shopId: string; action: ShopAction }): Promise<AccessibleShop> {
  const shop = await assertUserCanAccessShop(input);
  if (!hasShopAction(shop.access_level, input.action)) {
    throw new AppError('FORBIDDEN', 'Your shop access level does not allow this action', 403, {
      shopId: input.shopId,
      action: input.action,
      accessLevel: shop.access_level
    });
  }
  return shop;
}

export async function resolveCurrentShopId(input: { tenantId: string; userId: string; requestedShopId?: string | null; sessionCurrentShopId?: string | null }): Promise<string | null> {
  const shops = await listAccessibleShops(input);
  if (shops.length === 0) return null;
  if (input.requestedShopId && shops.some(shop => shop.id === input.requestedShopId)) return input.requestedShopId;
  if (input.sessionCurrentShopId && shops.some(shop => shop.id === input.sessionCurrentShopId)) return input.sessionCurrentShopId;
  return shops.find(shop => shop.is_default)?.id ?? shops[0]!.id;
}

export async function setSessionCurrentShop(input: { tenantId: string; userId: string; sessionId: string; shopId: string }): Promise<void> {
  await assertUserCanAccessShop(input);
  await query(
    `UPDATE sessions
     SET current_tenant_shop_id = $4
     WHERE id = $1 AND tenant_id = $2 AND user_id = $3`,
    [input.sessionId, input.tenantId, input.userId, input.shopId]
  );
}

export async function listUserShopAccessSummaries(tenantId: string): Promise<UserShopAccessSummary[]> {
  const rows = await query<{
    user_id: string;
    email: string;
    name: string;
    role: string;
    shop_id: string | null;
    shop_name: string | null;
    access_level: string | null;
    is_default: boolean | null;
  }>(
    `SELECT u.id AS user_id,
            u.email::text AS email,
            u.name,
            m.role,
            ts.id AS shop_id,
            ts.shop_name,
            usa.access_level,
            usa.is_default
     FROM memberships m
     JOIN users u ON u.id = m.user_id
     LEFT JOIN user_shop_access usa
       ON usa.tenant_id = m.tenant_id AND usa.user_id = m.user_id
     LEFT JOIN tenant_shops ts ON ts.id = usa.tenant_shop_id
     WHERE m.tenant_id = $1
     ORDER BY u.email ASC, usa.is_default DESC, ts.shop_name ASC`,
    [tenantId]
  );

  const byUser = new Map<string, UserShopAccessSummary>();
  for (const row of rows) {
    const current = byUser.get(row.user_id) ?? { user_id: row.user_id, email: row.email, name: row.name, role: row.role, shops: [] };
    if (row.shop_id && row.shop_name) {
      current.shops.push({ id: row.shop_id, name: row.shop_name, isDefault: Boolean(row.is_default), accessLevel: row.access_level ?? 'member' });
    }
    byUser.set(row.user_id, current);
  }
  return Array.from(byUser.values());
}

export async function replaceUserShopAccess(input: ReplaceUserShopAccessInput): Promise<void> {
  const membershipRows = await query<{ id: string }>(
    'SELECT user_id AS id FROM memberships WHERE tenant_id = $1 AND user_id = $2 LIMIT 1',
    [input.tenantId, input.targetUserId]
  );
  if (!membershipRows[0]) throw new AppError('NOT_FOUND', 'User is not a member of this tenant', 404, { userId: input.targetUserId });

  const byShop = new Map<string, ShopAccessLevel>();
  for (const item of input.shops) byShop.set(item.shopId, item.accessLevel);
  const uniqueShopIds = Array.from(byShop.keys());
  if (input.defaultShopId && !uniqueShopIds.includes(input.defaultShopId)) {
    throw new AppError('VALIDATION_ERROR', 'Default shop must be included in assigned shops', 400);
  }
  if (uniqueShopIds.length > 0) {
    const rows = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM tenant_shops WHERE tenant_id = $1 AND id = ANY($2::uuid[])`,
      [input.tenantId, uniqueShopIds]
    );
    if (Number(rows[0]?.count ?? 0) !== uniqueShopIds.length) {
      throw new AppError('VALIDATION_ERROR', 'One or more shops do not belong to this tenant', 400);
    }
  }

  await query('DELETE FROM user_shop_access WHERE tenant_id = $1 AND user_id = $2', [input.tenantId, input.targetUserId]);
  for (const shopId of uniqueShopIds) {
    await query(
      `INSERT INTO user_shop_access(tenant_id, user_id, tenant_shop_id, access_level, is_default)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.tenantId, input.targetUserId, shopId, byShop.get(shopId) ?? 'member', input.defaultShopId ? shopId === input.defaultShopId : shopId === uniqueShopIds[0]]
    );
  }
  await query(
    `UPDATE sessions
     SET current_tenant_shop_id = NULL
     WHERE tenant_id = $1 AND user_id = $2 AND current_tenant_shop_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM user_shop_access usa
         WHERE usa.tenant_id = sessions.tenant_id
           AND usa.user_id = sessions.user_id
           AND usa.tenant_shop_id = sessions.current_tenant_shop_id
       )`,
    [input.tenantId, input.targetUserId]
  );
}
