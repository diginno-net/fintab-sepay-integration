import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../../shared/http/errors.js';
import { validateBody } from '../../shared/http/validate.js';
import { hashSessionToken, requireAuth } from '../../shared/auth/auth-context.js';
import { permissionsForRole } from '../../shared/auth/permissions.js';
import { verifyPassword } from '../../shared/auth/password.js';
import { query } from '../../shared/persistence/db.js';
import { AUDIT_ACTIONS, tryWriteAuditLog } from '../audit/audit.service.js';
import { listAccessibleShops, resolveCurrentShopId, setSessionCurrentShop } from '../tenant/shop-access.service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
const currentShopSchema = z.object({ shopId: z.string().uuid() });

type LoginUserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'accountant' | 'operator' | 'viewer';
};

export async function registerIdentityRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/auth/login', async (request, reply) => {
    const body = validateBody(request, loginSchema);
    const rows = await query<LoginUserRow>(
      `SELECT u.id, u.email, u.name, u.password_hash, m.tenant_id, m.role
       FROM users u
       JOIN memberships m ON m.user_id = u.id
       WHERE u.email = $1 AND u.status = 'active'
       ORDER BY m.created_at ASC
       LIMIT 1`,
      [body.email]
    );

    const user = rows[0];
    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
    }

    const token = randomBytes(32).toString('base64url');
    const sessionRows = await query<{ id: string }>(
      `INSERT INTO sessions(user_id, tenant_id, token_hash, expires_at)
       VALUES ($1, $2, $3, now() + interval '7 days')
       RETURNING id`,
      [user.id, user.tenant_id, hashSessionToken(token)]
    );

    const secureCookie = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    reply.header('set-cookie', `sid=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}${secureCookie}`);

    const shops = await listAccessibleShops({ tenantId: user.tenant_id, userId: user.id });
    const currentShopId = await resolveCurrentShopId({ tenantId: user.tenant_id, userId: user.id });
    if (currentShopId) {
      await query('UPDATE sessions SET current_tenant_shop_id = $2 WHERE id = $1', [sessionRows[0]!.id, currentShopId]);
    }
    await tryWriteAuditLog({
      tenantId: user.tenant_id,
      actorUserId: user.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.AUTH_LOGIN,
      resourceType: 'session',
      resourceId: sessionRows[0]!.id,
      metadata: { email: user.email },
      correlationId: request.id
    });
    return {
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: permissionsForRole(user.role) },
        tenant: { id: user.tenant_id },
        shops: shops.map(toSessionShop),
        currentShopId
      }
    };
  });

  app.get('/v1/me', { preHandler: requireAuth }, async request => {
    const user = request.user!;
    const shops = await listAccessibleShops({ tenantId: user.tenantId, userId: user.id });
    const currentShopId = await resolveCurrentShopId({ tenantId: user.tenantId, userId: user.id, sessionCurrentShopId: user.currentShopId });
    return {
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: permissionsForRole(user.role) },
        tenant: { id: user.tenantId },
        shops: shops.map(toSessionShop),
        currentShopId
      }
    };
  });

  app.post('/v1/auth/logout', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user!;
    await query('DELETE FROM sessions WHERE id = $1 AND user_id = $2', [user.sessionId, user.id]);
    await tryWriteAuditLog({
      tenantId: user.tenantId,
      actorUserId: user.id,
      actorType: 'user',
      action: AUDIT_ACTIONS.AUTH_LOGOUT,
      resourceType: 'session',
      resourceId: user.sessionId,
      correlationId: request.id
    });
    const secureCookie = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    reply.header('set-cookie', `sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie}`);
    return { data: { ok: true } };
  });

  app.put('/v1/me/current-shop', { preHandler: requireAuth }, async request => {
    const user = request.user!;
    const body = validateBody(request, currentShopSchema);
    await setSessionCurrentShop({ tenantId: user.tenantId, userId: user.id, sessionId: user.sessionId, shopId: body.shopId });
    return { data: { currentShopId: body.shopId } };
  });

  if (process.env.NODE_ENV !== 'production') {
    app.get('/v1/auth/dev-login', async (request, reply) => {
      const rows = await query<LoginUserRow>(
        `SELECT u.id, u.email, u.name, u.password_hash, m.tenant_id, m.role
         FROM users u
         JOIN memberships m ON m.user_id = u.id
         WHERE u.status = 'active'
         ORDER BY m.created_at ASC
         LIMIT 1`
      );
      const user = rows[0];
      if (!user) throw new AppError('NOT_FOUND', 'No active user found', 404);

      const token = randomBytes(32).toString('base64url');
      await query(
        `INSERT INTO sessions(user_id, tenant_id, token_hash, expires_at)
         VALUES ($1, $2, $3, now() + interval '7 days')`,
        [user.id, user.tenant_id, hashSessionToken(token)]
      );

      reply.header('set-cookie', `sid=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`);
      return { data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } } };
    });
  }
}

function toSessionShop(shop: { id: string; shop_name: string; status: string; access_level?: string; is_default?: boolean; has_pancake_config?: boolean; has_sepay_config?: boolean }) {
  return {
    id: shop.id,
    name: shop.shop_name,
    status: shop.status,
    accessLevel: shop.access_level ?? 'viewer',
    isDefault: Boolean(shop.is_default),
    has_pancake_config: Boolean(shop.has_pancake_config),
    has_sepay_config: Boolean(shop.has_sepay_config),
    hasPancakeConfig: Boolean(shop.has_pancake_config),
    hasSepayConfig: Boolean(shop.has_sepay_config)
  };
}
