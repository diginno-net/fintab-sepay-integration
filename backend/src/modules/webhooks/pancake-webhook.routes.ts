import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../shared/auth/rbac-middleware.js';
import { AppError } from '../../shared/http/errors.js';
import { validateBody, validateParams } from '../../shared/http/validate.js';
import { query } from '../../shared/persistence/db.js';
import { decryptSecret } from '../integrations/secret.service.js';
import { testPancakeConnection } from '../pancake/pancake.service.js';
import { pancakeClientForShop } from '../pancake/pancake.service.js';
import { assertShopBelongsToTenant } from '../tenant/tenant-shop.service.js';
import { processPancakeWebhookAutomation } from './webhook-automation.service.js';
import { persistWebhookInbox, resolveShopForWebhook } from './webhook-inbox.service.js';

const webhookBodySchema = z.record(z.unknown());
const shopParamsSchema = z.object({ shopId: z.string().uuid() });
const configureWebhookSchema = z.object({
  webhookUrl: z.string().url(),
  webhookTypes: z.array(z.string()).default(['orders']),
  autoCreateDraft: z.boolean().default(false)
});

export async function registerPancakeWebhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/webhooks/pancake', async request => {
    const payload = validateBody(request, webhookBodySchema);
    const secretHeader = request.headers['x-pancake-webhook-secret'];
    const providedSecret = Array.isArray(secretHeader) ? secretHeader[0] : secretHeader;
    const shop = await resolveShopForWebhook(payload, providedSecret);
    const inbox = await persistWebhookInbox({ shop, payload, headers: request.headers as Record<string, unknown> });
    if (inbox.duplicate) return { data: { received: true, duplicate: true, inboxId: inbox.entry.id } };
    const automation = await processPancakeWebhookAutomation(shop, inbox.entry);
    return { data: { received: true, duplicate: false, inboxId: inbox.entry.id, automation } };
  });

  app.post('/v1/tenant-shops/:shopId/configure-webhook', { preHandler: requirePermission('webhook:configure') }, async request => {
    const { shopId } = validateParams(request, shopParamsSchema);
    await assertShopBelongsToTenant(request.user!.tenantId, shopId);
    const body = validateBody(request, configureWebhookSchema);
    const connection = await testPancakeConnection(request.user!.tenantId, shopId);
    const client = await pancakeClientForShop(request.user!.tenantId, shopId);
    const rows = await query<{ encrypted_secret_json: Record<string, unknown> }>('SELECT encrypted_secret_json FROM tenant_shops WHERE tenant_id = $1 AND id = $2 LIMIT 1', [request.user!.tenantId, shopId]);
    const encryptedWebhookSecret = rows[0]?.encrypted_secret_json.webhook_secret;
    if (typeof encryptedWebhookSecret !== 'string') {
      throw new AppError('VALIDATION_ERROR', 'Shop chưa cấu hình webhook_secret', 400, { code: 'SHOP_WEBHOOK_SECRET_REQUIRED' });
    }
    const headers = { 'X-PANCAKE-WEBHOOK-SECRET': decryptSecret(encryptedWebhookSecret) };
    const providerResponse = await client.configureWebhook({ webhookUrl: body.webhookUrl, webhookTypes: body.webhookTypes, headers });
    await query(
      `UPDATE tenant_shops
       SET config_json = config_json || $3::jsonb, updated_at = now()
       WHERE tenant_id = $1 AND id = $2`,
      [request.user!.tenantId, shopId, { webhook_url: body.webhookUrl, webhook_types: body.webhookTypes, webhook_auto_create_draft: body.autoCreateDraft }]
    );
    return { data: { ok: true, connection, providerResponse } };
  });
}
