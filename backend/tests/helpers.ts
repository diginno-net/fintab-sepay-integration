import { randomUUID } from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
const TEST_PASSWORD = 'testpassword123';
const TEST_PASSWORD_HASH = 'scrypt$7598cff20d4ceb37afe248703476147e$3d6032fd373373adc8116d868151a38cb6fa0a4e7eb91eb50c89fb8e404bfaca0d6ed0fc9f306aff3042ede3f4c4591a44e15e4c97aa372d78996776d8f75e78';

function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/fintab_sepay',
      max: 5
    });
  }
  return _pool;
}

export async function closeTestPool(): Promise<void> {
  if (_pool) { await _pool.end(); _pool = null; }
}

export async function queryAll<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}

export async function createTestTenant(name: string): Promise<{ id: string; name: string }> {
  const id = randomUUID();
  await queryAll('INSERT INTO tenants (id, name) VALUES ($1, $2)', [id, name]);
  return { id, name };
}

export async function createTestUser(
  tenantId: string,
  email: string,
  name: string,
  role: string
): Promise<{ id: string; email: string; tenantId: string; role: string; password: string }> {
  const id = randomUUID();
  await queryAll(
    'INSERT INTO users (id, email, name, password_hash, status) VALUES ($1, $2, $3, $4, $5)',
    [id, email, name, TEST_PASSWORD_HASH, 'active']
  );
  await queryAll(
    'INSERT INTO memberships (id, user_id, tenant_id, role) VALUES ($1, $2, $3, $4)',
    [randomUUID(), id, tenantId, role]
  );
  return { id, email, tenantId, role, password: TEST_PASSWORD };
}

export async function createTestShop(
  tenantId: string,
  externalShopId: string,
  shopName: string
): Promise<{ id: string; tenantId: string; externalShopId: string; shopName: string }> {
  const id = randomUUID();
  await queryAll(
    'INSERT INTO tenant_shops (id, tenant_id, external_shop_id, shop_name, status, config_json) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, tenantId, externalShopId, shopName, 'active', '{}']
  );
  return { id, tenantId, externalShopId, shopName };
}

export async function createTestProduct(
  tenantId: string,
  sourceProductCode: string,
  productName: string
): Promise<{ id: string; sourceProductCode: string; productName: string }> {
  const id = randomUUID();
  await queryAll(
    `INSERT INTO products (id, tenant_id, source_product_code, product_name, status)
     VALUES ($1, $2, $3, $4, 'active')`,
    [id, tenantId, sourceProductCode, productName]
  );
  return { id, sourceProductCode, productName };
}

export async function createTestInvoiceJob(
  tenantId: string,
  tenantShopId: string,
  sourceOrderId: string,
  status: string
): Promise<{ id: string; sourceOrderId: string; status: string }> {
  const id = randomUUID();
  await queryAll(
    `INSERT INTO invoice_jobs (id, tenant_id, tenant_shop_id, source_order_id, status)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, tenantId, tenantShopId, sourceOrderId, status]
  );
  return { id, sourceOrderId, status };
}

export async function cleanupTenant(tenantId: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM memberships WHERE tenant_id = $1', [tenantId]);
    await client.query(`DELETE FROM users WHERE id IN (SELECT user_id FROM memberships WHERE tenant_id = $1)`, [tenantId]);
    await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await client.query('COMMIT');
  } catch {
    await client.query('ROLLBACK');
    throw new Error(`Failed to cleanup tenant ${tenantId}`);
  } finally {
    client.release();
  }
}

export async function cleanupShop(shopId: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM integration_configs WHERE tenant_shop_id = $1', [shopId]);
    await client.query('DELETE FROM tenant_shops WHERE id = $1', [shopId]);
    await client.query('COMMIT');
  } catch {
    await client.query('ROLLBACK');
    throw new Error(`Failed to cleanup shop ${shopId}`);
  } finally {
    client.release();
  }
}

export async function loginAndGetCookie(app: { inject: (opts: { method: string; url: string; payload?: unknown }) => Promise<{ cookies: Array<{ name: string; value?: string }> }> }, email: string, password: string): Promise<string | undefined> {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email, password }
  });
  const cookie = Array.isArray(res.cookies) ? res.cookies.find(c => c.name === 'sid') : res.cookies?.['sid'];
  return cookie?.value;
}
