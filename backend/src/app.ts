import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.js';
import { registerAuditRoutes } from './modules/audit/audit.routes.js';
import { registerIdentityRoutes } from './modules/identity/identity.routes.js';
import { registerIntegrationRoutes } from './modules/integrations/integrations.routes.js';
import { registerInvoiceRoutes } from './modules/invoices/invoice.routes.js';
import { registerJobsRoutes } from './modules/jobs/jobs.routes.js';
import { registerPancakeRoutes } from './modules/pancake/pancake.routes.js';
import { registerProductRoutes } from './modules/products/products.routes.js';
import { registerTaxRoutes } from './modules/tax/tax.routes.js';
import { registerTenantRoutes } from './modules/tenant/tenant.routes.js';
import { registerPancakeWebhookRoutes } from './modules/webhooks/pancake-webhook.routes.js';
import { errorHandler } from './shared/http/error-handler.js';
import { getCorrelationId, setCorrelationId } from './shared/observability/correlation-id.js';
import { loggerRedactPaths, redactUrl } from './shared/observability/redaction.js';
import { registerOpenApi } from './shared/openapi/openapi.js';
import { checkDatabaseReady } from './shared/persistence/db.js';
import { registerOriginGuard } from './shared/security/origin-guard.js';

function requestIdFromHeader(header: string | string[] | undefined): string | undefined {
  if (Array.isArray(header)) return header[0];
  return header;
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: loggerRedactPaths
    },
    genReqId: request => requestIdFromHeader(request.headers['x-request-id']) ?? randomUUID()
  });

  app.addHook('onRequest', async (request, reply) => {
    const correlationId = getCorrelationId(request);
    setCorrelationId(reply, correlationId);
    request.log = request.log.child({ request_id: correlationId, url: redactUrl(request.url) });
  });

  app.setErrorHandler(errorHandler);

  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map(s => s.trim()),
    credentials: true
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    addHeadersOnExceeding: { 'x-ratelimit-limit': true, 'x-ratelimit-remaining': true, 'x-ratelimit-reset': true },
    addHeaders: { 'retry-after': true, 'x-ratelimit-limit': true, 'x-ratelimit-remaining': true, 'x-ratelimit-reset': true }
  });
  await registerOriginGuard(app);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  await registerOpenApi(app);
  await registerIdentityRoutes(app);
  await registerTenantRoutes(app);
  await registerIntegrationRoutes(app);
  await registerPancakeRoutes(app);
  await registerProductRoutes(app);
  await registerTaxRoutes(app);
  await registerInvoiceRoutes(app);
  await registerJobsRoutes(app);
  await registerPancakeWebhookRoutes(app);
  await registerAuditRoutes(app);

  app.get('/v1/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                status: { type: 'string' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                request_id: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => ({
    data: { status: 'ok' },
    meta: { request_id: reply.getHeader('x-request-id')?.toString() ?? request.id }
  }));

  app.get('/v1/ready', async (request, reply) => {
    try {
      await checkDatabaseReady();
      return { data: { status: 'ready', checks: { database: 'ok' } }, meta: { request_id: reply.getHeader('x-request-id')?.toString() ?? request.id } };
    } catch (error) {
      request.log.error({ err: error }, 'Readiness check failed');
      reply.status(503);
      return { data: { status: 'not_ready', checks: { database: 'failed' } }, meta: { request_id: reply.getHeader('x-request-id')?.toString() ?? request.id } };
    }
  });

  app.get('/v1/openapi.json', async () => app.swagger());

  return app;
}
