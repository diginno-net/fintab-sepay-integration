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

describe('tenant isolation', () => {
  let app: FastifyInstance;
  const unique = randomUUID().slice(0, 8);

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Tenant A shops are invisible to Tenant B', async () => {
    const tenantA = await createTestTenant(`Tenant Isolation A ${unique}`);
    const tenantB = await createTestTenant(`Tenant Isolation B ${unique}`);
    const shopA = await createTestShop(tenantA.id, `ext-shop-a-${unique}`, `Shop A for Isolation ${unique}`);
    const userA = await createTestUser(tenantA.id, `user-a-iso-${unique}@test.com`, 'User A', 'admin');
    const userB = await createTestUser(tenantB.id, `user-b-iso-${unique}@test.com`, 'User B', 'admin');

    try {
      const cookieA = await loginAndGetCookie(app, userA.email, userA.password);
      expect(cookieA).toBeDefined();

      const cookieB = await loginAndGetCookie(app, userB.email, userB.password);
      expect(cookieB).toBeDefined();

      const resA = await app.inject({
        method: 'GET',
        url: '/v1/tenant-shops',
        headers: { cookie: `sid=${cookieA}` }
      });
      expect(resA.statusCode).toBe(200);
      const shopsA = (resA.json() as { data: unknown[] }).data;
      expect(shopsA.length).toBeGreaterThan(0);

      const resB = await app.inject({
        method: 'GET',
        url: '/v1/tenant-shops',
        headers: { cookie: `sid=${cookieB}` }
      });
      expect(resB.statusCode).toBe(200);
      const shopsB = (resB.json() as { data: unknown[] }).data;
      expect(shopsB.length).toBe(0);
    } finally {
      await cleanupShop(shopA.id);
      await cleanupTenant(tenantA.id);
      await cleanupTenant(tenantB.id);
    }
  });

  it('Tenant B cannot access Tenant A shop by direct ID', async () => {
    const tenantA2 = await createTestTenant(`Tenant Isolation A2 ${unique}`);
    const tenantB2 = await createTestTenant(`Tenant Isolation B2 ${unique}`);
    const shopA2 = await createTestShop(tenantA2.id, `ext-shop-a2-${unique}`, `Shop A2 ${unique}`);
    const userB2 = await createTestUser(tenantB2.id, `user-b2-iso-${unique}@test.com`, 'User B2', 'admin');

    try {
      const cookieB = await loginAndGetCookie(app, userB2.email, userB2.password);
      expect(cookieB).toBeDefined();

      const res = await app.inject({
        method: 'GET',
        url: `/v1/tenant-shops/${shopA2.id}`,
        headers: { cookie: `sid=${cookieB}` }
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await cleanupShop(shopA2.id);
      await cleanupTenant(tenantA2.id);
      await cleanupTenant(tenantB2.id);
    }
  });
});
