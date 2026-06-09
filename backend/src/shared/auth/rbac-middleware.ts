import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../http/errors.js';
import { requireAuth } from './auth-context.js';
import { hasPermission, type Permission } from './permissions.js';

export function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireAuth(request, reply);
    if (!request.user || !hasPermission(request.user.role, permission)) {
      throw new AppError('FORBIDDEN', 'Missing required permission', 403, { permission });
    }
  };
}
