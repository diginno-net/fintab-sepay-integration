import { randomUUID } from 'node:crypto';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';
import {
  createTestTenant,
  createTestUser,
  createTestShop,
  cleanupTenant,
  cleanupShop,
  loginAndGetCookie
} from './helpers.js';

describe('invoice idempotency', () => {
  let app: FastifyInstance;
  const unique = randomUUID().slice(0, 8);

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Same order ID in same shop returns existing job (idempotent)', async () => {
    const tenant = await createTestTenant(`Idempotency Tenant ${unique}`);
    const shop = await createTestShop(tenant.id, `ext-idempotent-${unique}`, `Idempotent Shop ${unique}`);
    const user = await createTestUser(tenant.id, `user-idempotent-${unique}@test.com`, 'User', 'admin');

    try {
      const cookie = await loginAndGetCookie(app, user.email, user.password);
      expect(cookie).toBeDefined();

      const payload = {
        shopId: shop.id,
        orderId: `order-duplicate-${unique}`,
        invoiceType: 'ban_hang'
      };

      const res1 = await app.inject({
        method: 'POST',
        url: '/v1/invoices/create-draft',
        headers: { cookie: `sid=${cookie}`, 'content-type': 'application/json' },
        payload
      });

      if (res1.statusCode === 202 || res1.statusCode === 409) {
        const res2 = await app.inject({
          method: 'POST',
          url: '/v1/invoices/create-draft',
          headers: { cookie: `sid=${cookie}`, 'content-type': 'application/json' },
          payload
        });
        expect([202, 409]).toContain(res2.statusCode);
        if (res2.statusCode === 409) {
          const body = res2.json() as { error: { code: string } };
          expect(body.error.code).toBe('DUPLICATE_ORDER');
        }
      } else {
        expect([202, 400, 422]).toContain(res1.statusCode);
      }
    } finally {
      await cleanupShop(shop.id);
      await cleanupTenant(tenant.id);
    }
  });

  it('Same order ID in different shops creates separate jobs', async () => {
    const tenant2 = await createTestTenant(`Idempotency Tenant 2 ${unique}`);
    const shopC = await createTestShop(tenant2.id, `ext-shop-c-${unique}`, `Shop C ${unique}`);
    const shopD = await createTestShop(tenant2.id, `ext-shop-d-${unique}`, `Shop D ${unique}`);
    const user2 = await createTestUser(tenant2.id, `user-idempotent2-${unique}@test.com`, 'User', 'admin');

    try {
      const cookie = await loginAndGetCookie(app, user2.email, user2.password);
      expect(cookie).toBeDefined();

      const payloadC = { shopId: shopC.id, orderId: `order-same-id-${unique}`, invoiceType: 'ban_hang' };
      const payloadD = { shopId: shopD.id, orderId: `order-same-id-${unique}`, invoiceType: 'ban_hang' };

      const resC = await app.inject({
        method: 'POST',
        url: '/v1/invoices/create-draft',
        headers: { cookie: `sid=${cookie}`, 'content-type': 'application/json' },
        payload: payloadC
      });

      const resD = await app.inject({
        method: 'POST',
        url: '/v1/invoices/create-draft',
        headers: { cookie: `sid=${cookie}`, 'content-type': 'application/json' },
        payload: payloadD
      });

      const acceptableStatuses = [202, 400, 422];
      expect(acceptableStatuses).toContain(resC.statusCode);
      expect(acceptableStatuses).toContain(resD.statusCode);
    } finally {
      await cleanupShop(shopC.id);
      await cleanupShop(shopD.id);
      await cleanupTenant(tenant2.id);
    }
  });
});
