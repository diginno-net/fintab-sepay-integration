import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../../shared/http/errors.js';
import { validateBody } from '../../shared/http/validate.js';
import { hashSessionToken, requireAuth } from '../../shared/auth/auth-context.js';
import { permissionsForRole } from '../../shared/auth/permissions.js';
import { verifyPassword } from '../../shared/auth/password.js';
import { query } from '../../shared/persistence/db.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

type LoginUserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'accountant' | 'operator' | 'viewer';
};

type ShopRow = {
  id: string;
  name: string;
  status: string;
  has_pancake_config: boolean;
  has_sepay_config: boolean;
};

async function shopsForTenant(tenantId: string): Promise<ShopRow[]> {
  return query<ShopRow>(
    `SELECT ts.id,
            ts.shop_name AS name,
            ts.status,
            (ts.encrypted_secret_json ? 'api_key') AS has_pancake_config,
            EXISTS (
              SELECT 1 FROM integration_configs ic
              WHERE ic.tenant_shop_id = ts.id AND ic.provider = 'sepay'
            ) AS has_sepay_config
     FROM tenant_shops ts
     WHERE ts.tenant_id = $1
     ORDER BY ts.created_at ASC`,
    [tenantId]
  );
}

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
    await query(
      `INSERT INTO sessions(user_id, tenant_id, token_hash, expires_at)
       VALUES ($1, $2, $3, now() + interval '7 days')`,
      [user.id, user.tenant_id, hashSessionToken(token)]
    );

    const secureCookie = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    reply.header('set-cookie', `sid=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}${secureCookie}`);

    const shops = await shopsForTenant(user.tenant_id);
    return {
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: permissionsForRole(user.role) },
        tenant: { id: user.tenant_id },
        shops,
        currentShopId: shops[0]?.id ?? null
      }
    };
  });

  app.get('/v1/me', { preHandler: requireAuth }, async request => {
    const user = request.user!;
    const shops = await shopsForTenant(user.tenantId);
    return {
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: permissionsForRole(user.role) },
        tenant: { id: user.tenantId },
        shops,
        currentShopId: shops[0]?.id ?? null
      }
    };
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
