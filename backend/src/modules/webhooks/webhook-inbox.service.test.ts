import { describe, expect, it } from 'vitest';
import { extractEventType, extractPayloadShopId, extractSourceObjectId, maskHeaders, payloadHash } from './webhook-inbox.service.js';

describe('webhook inbox helpers', () => {
  it('extracts webhook identifiers', () => {
    const payload = { shop_id: 'shop-1', event_type: 'orders', order_id: 'order-1' };
    expect(extractPayloadShopId(payload)).toBe('shop-1');
    expect(extractEventType(payload)).toBe('orders');
    expect(extractSourceObjectId(payload)).toBe('order-1');
  });

  it('hashes payload and masks sensitive headers', () => {
    expect(payloadHash({ a: 1 })).toHaveLength(64);
    expect(maskHeaders({ 'x-pancake-webhook-secret': 'secret', 'x-request-id': 'id' })).toEqual({
      'x-pancake-webhook-secret': '[REDACTED]',
      'x-request-id': 'id'
    });
  });
});
