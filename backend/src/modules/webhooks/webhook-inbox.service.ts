import { createHash, timingSafeEqual } from 'node:crypto';
import { AppError } from '../../shared/http/errors.js';
import { query } from '../../shared/persistence/db.js';
import { decryptSecret } from '../integrations/secret.service.js';

export type WebhookShop = {
  id: string;
  tenant_id: string;
  external_shop_id: string;
  shop_name: string;
  config_json: Record<string, unknown>;
  encrypted_secret_json: Record<string, unknown>;
};

export type WebhookInboxEntry = {
  id: string;
  tenant_id: string;
  tenant_shop_id: string;
  event_type: string;
  source_object_id: string;
  payload_hash: string;
  status: string;
  payload_json: Record<string, unknown>;
};

export function payloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function extractPayloadShopId(payload: Record<string, unknown>): string | null {
  return stringValue(payload.shop_id ?? payload.shopId ?? payload.page_id ?? payload.pageId ?? nested(payload, ['shop', 'id']));
}

export function extractEventType(payload: Record<string, unknown>): string {
  return stringValue(payload.event_type ?? payload.event ?? payload.type ?? payload.action) ?? 'unknown';
}

export function extractSourceObjectId(payload: Record<string, unknown>): string {
  return stringValue(payload.order_id ?? payload.orderId ?? payload.id ?? nested(payload, ['order', 'id']) ?? nested(payload, ['data', 'id'])) ?? payloadHash(payload).slice(0, 32);
}

export function maskHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    masked[key] = lower.includes('secret') || lower.includes('authorization') || lower.includes('cookie') ? '[REDACTED]' : value;
  }
  return masked;
}

export async function resolveShopForWebhook(payload: Record<string, unknown>, providedSecret: string | undefined): Promise<WebhookShop> {
  if (!providedSecret) throw new AppError('UNAUTHORIZED', 'Missing Pancake webhook secret', 401);
  const externalShopId = extractPayloadShopId(payload);
  const params: unknown[] = [];
  let sql = `SELECT id, tenant_id, external_shop_id, shop_name, config_json, encrypted_secret_json FROM tenant_shops WHERE provider = 'pancake'`;
  if (externalShopId) {
    params.push(externalShopId);
    sql += ` AND external_shop_id = $${params.length}`;
  }
  const shops = await query<WebhookShop>(sql, params);
  for (const shop of shops) {
    const encryptedSecret = shop.encrypted_secret_json.webhook_secret;
    if (typeof encryptedSecret !== 'string') continue;
    if (safeEqual(decryptSecret(encryptedSecret), providedSecret)) return shop;
  }
  throw new AppError('UNAUTHORIZED', 'Invalid Pancake webhook secret', 401);
}

export async function persistWebhookInbox(input: {
  shop: WebhookShop;
  payload: Record<string, unknown>;
  headers: Record<string, unknown>;
}): Promise<{ entry: WebhookInboxEntry; duplicate: boolean }> {
  const eventType = extractEventType(input.payload);
  const sourceObjectId = extractSourceObjectId(input.payload);
  const hash = payloadHash(input.payload);
  const rows = await query<WebhookInboxEntry>(
    `INSERT INTO webhook_inbox(
       tenant_id, tenant_shop_id, event_type, source_object_id, payload_hash, headers_json, payload_json, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'received')
     ON CONFLICT (tenant_shop_id, event_type, source_object_id, payload_hash) DO NOTHING
     RETURNING *`,
    [input.shop.tenant_id, input.shop.id, eventType, sourceObjectId, hash, maskHeaders(input.headers), input.payload]
  );
  if (rows[0]) return { entry: rows[0], duplicate: false };
  const existing = await query<WebhookInboxEntry>(
    `SELECT * FROM webhook_inbox WHERE tenant_shop_id = $1 AND event_type = $2 AND source_object_id = $3 AND payload_hash = $4 LIMIT 1`,
    [input.shop.id, eventType, sourceObjectId, hash]
  );
  return { entry: existing[0]!, duplicate: true };
}

export async function markWebhookProcessed(inboxId: string, status: 'processed' | 'skipped' | 'failed', error?: unknown): Promise<void> {
  await query(
    `UPDATE webhook_inbox SET status = $2, processed_at = now(), error_json = $3, updated_at = now() WHERE id = $1`,
    [inboxId, status, error ?? null]
  );
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function stringValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function nested(source: Record<string, unknown>, path: string[]): unknown {
  let cursor: unknown = source;
  for (const key of path) {
    if (typeof cursor !== 'object' || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}
