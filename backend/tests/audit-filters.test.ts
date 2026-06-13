import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { cleanupTenant, createTestShop, createTestTenant, createTestUser, loginAndGetCookie, queryAll } from './helpers.js';

describe('audit log filters', () => {
  let app: FastifyInstance;
  const unique = randomUUID().slice(0, 8);

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('filters audit logs by actor type, action, resource, shop and date', async () => {
    const tenant = await createTestTenant(`Audit Filter ${unique}`);
    const shop = await createTestShop(tenant.id, `audit-shop-${unique}`, `Audit Shop ${unique}`);
    const user = await createTestUser(tenant.id, `audit-${unique}@test.com`, 'Audit User', 'admin');
    const otherShop = await createTestShop(tenant.id, `audit-shop-other-${unique}`, `Audit Other ${unique}`);

    try {
      const cookie = await loginAndGetCookie(app, user.email, user.password);
      expect(cookie).toBeDefined();
      const now = new Date();
      await queryAll(
        `INSERT INTO audit_logs(id, tenant_id, tenant_shop_id, actor_user_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
         VALUES
         ($1, $2, $3, $4, 'user', 'invoice.issue_requested', 'invoice_job', gen_random_uuid(), '{}', $6),
         ($5, $2, $7, $4, 'worker', 'job.retry', 'background_job', gen_random_uuid(), '{}', $6)`,
        [randomUUID(), tenant.id, shop.id, user.id, randomUUID(), now.toISOString(), otherShop.id]
      );

      const params = new URLSearchParams({
        actorType: 'user',
        action: 'invoice.issue',
        resource: 'invoice',
        shopId: shop.id,
        fromDate: new Date(now.getTime() - 60_000).toISOString(),
        toDate: new Date(now.getTime() + 60_000).toISOString()
      });
      const res = await app.inject({ method: 'GET', url: `/v1/audit-logs?${params}`, headers: { cookie: `sid=${cookie}` } });

      expect(res.statusCode).toBe(200);
      const rows = res.json().data as Array<{ action: string; actor_type: string; tenant_shop_id: string }>;
      expect(rows).toHaveLength(1);
      expect(rows[0]!.action).toBe('invoice.issue_requested');
      expect(rows[0]!.actor_type).toBe('user');
      expect(rows[0]!.tenant_shop_id).toBe(shop.id);
    } finally {
      await cleanupTenant(tenant.id);
    }
  });
});
