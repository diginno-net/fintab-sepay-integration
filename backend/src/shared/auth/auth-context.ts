import type { FastifyReply, FastifyRequest } from 'fastify';
import { createHash } from 'node:crypto';
import { query } from '../persistence/db.js';
import { AppError } from '../http/errors.js';

export type Role = 'owner' | 'admin' | 'accountant' | 'operator' | 'viewer';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: Role;
};

export type SessionRow = {
  user_id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: Role;
};

function parseCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.split('=');
    if (key === name) return decodeURIComponent(valueParts.join('='));
  }
  return undefined;
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function resolveAuthUser(request: FastifyRequest): Promise<AuthUser | null> {
  const token = parseCookie(request.headers.cookie, 'sid');
  if (!token) return null;

  const rows = await query<SessionRow>(
    `SELECT s.user_id, s.tenant_id, u.email, u.name, m.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     JOIN memberships m ON m.tenant_id = s.tenant_id AND m.user_id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND u.status = 'active'
     LIMIT 1`,
    [hashSessionToken(token)]
  );

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.user_id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.name,
    role: row.role
  };
}

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const user = await resolveAuthUser(request);
  if (!user) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  request.user = user;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
