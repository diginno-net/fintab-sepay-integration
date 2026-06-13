import type { FastifyInstance } from 'fastify';
import { env } from '../../config/env.js';
import { AppError } from '../http/errors.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const EXEMPT_PATHS = new Set(['/v1/webhooks/pancake']);

export async function registerOriginGuard(app: FastifyInstance): Promise<void> {
  const allowedOrigins = new Set(env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean));
  app.addHook('preHandler', async (request, _reply) => {
    if (!MUTATING_METHODS.has(request.method)) return;
    if (isExemptPath(request.url)) return;

    const origin = headerValue(request.headers.origin);
    if (origin) {
      assertAllowedOrigin(origin, allowedOrigins);
      return;
    }

    const referer = headerValue(request.headers.referer);
    if (referer) {
      let refererOrigin: string;
      try {
        refererOrigin = new URL(referer).origin;
      } catch {
        throw new AppError('FORBIDDEN', 'Invalid request referer', 403, { code: 'REFERER_INVALID' });
      }
      assertAllowedOrigin(refererOrigin, allowedOrigins);
      return;
    }

    // Server-side requests and test injects may not include Origin/Referer.
    // Browser form/fetch requests include at least Origin for mutating methods.
    if (env.NODE_ENV === 'production') {
      throw new AppError('FORBIDDEN', 'Missing request origin', 403, { code: 'ORIGIN_REQUIRED' });
    }
  });
}

function isExemptPath(url: string): boolean {
  const path = url.split('?')[0] ?? url;
  return EXEMPT_PATHS.has(path);
}

function headerValue(value: string | string[] | undefined): string | null {
  const text = Array.isArray(value) ? value[0] : value;
  return text && text.trim() ? text.trim() : null;
}

function assertAllowedOrigin(origin: string, allowedOrigins: Set<string>): void {
  if (!allowedOrigins.has(origin)) {
    throw new AppError('FORBIDDEN', 'Request origin is not allowed', 403, { code: 'ORIGIN_NOT_ALLOWED' });
  }
}
