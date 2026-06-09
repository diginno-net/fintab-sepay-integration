import { createOrReuseDraftJob, findInvoiceJobByOrder } from '../invoices/invoice-job.service.js';
import { mapPancakeOrderToInvoicePreview } from '../invoices/invoice-mapper.js';
import { validateInvoicePreview } from '../invoices/invoice-validation.js';
import { canCreateDraft } from '../pancake/pancake-status-policy.js';
import type { WebhookInboxEntry, WebhookShop } from './webhook-inbox.service.js';
import { extractSourceObjectId, markWebhookProcessed } from './webhook-inbox.service.js';

export async function processPancakeWebhookAutomation(shop: WebhookShop, entry: WebhookInboxEntry): Promise<{ action: string; invoiceJobId?: string; backgroundJobId?: string; reason?: string }> {
  const config = shop.config_json;
  if (config.webhook_auto_create_draft !== true) {
    await markWebhookProcessed(entry.id, 'skipped');
    return { action: 'skipped', reason: 'auto_create_disabled' };
  }

  const order = entry.payload_json;
  const sourceOrderId = extractSourceObjectId(order);
  const existing = await findInvoiceJobByOrder(shop.tenant_id, shop.id, sourceOrderId);
  if (existing?.status === 'issued') {
    await markWebhookProcessed(entry.id, 'skipped');
    return { action: 'skipped', reason: 'already_issued' };
  }

  const status = Number(order.status ?? order.status_id ?? order.updateStatus);
  const allowedStatuses = Array.isArray(config.allow_create_draft_statuses) ? config.allow_create_draft_statuses.map(Number) : undefined;
  if (Number.isFinite(status) && !canCreateDraft(status, allowedStatuses)) {
    await markWebhookProcessed(entry.id, 'skipped');
    return { action: 'skipped', reason: 'status_not_allowed' };
  }

  try {
    const invoiceType = config.default_invoice_type === 'gtgt' ? 'gtgt' : 'ban_hang';
    const preview = await mapPancakeOrderToInvoicePreview({ tenantId: shop.tenant_id, shopId: shop.id, order, invoiceType });
    validateInvoicePreview(preview);
    const result = await createOrReuseDraftJob({
      tenantId: shop.tenant_id,
      shopId: shop.id,
      actorUserId: null,
      sourceOrderId,
      invoiceType,
      sourceOrderSnapshot: order,
      requestPayload: preview.payload,
      warnings: preview.warnings
    });
    await markWebhookProcessed(entry.id, 'processed');
    return { action: 'create_draft_enqueued', invoiceJobId: result.invoiceJob.id, backgroundJobId: result.backgroundJobId };
  } catch (error) {
    await markWebhookProcessed(entry.id, 'failed', error instanceof Error ? { message: error.message } : { message: 'Unknown webhook automation error' });
    throw error;
  }
}
