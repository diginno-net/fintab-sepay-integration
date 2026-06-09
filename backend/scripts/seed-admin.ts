import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';
import { loadEnv } from '../src/config/env.js';

const scrypt = promisify(scryptCallback);
const { Pool } = pg;

const env = loadEnv();
const pool = new Pool({ connectionString: env.DATABASE_URL });

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(Buffer.from(password), salt, 64);
  return `scrypt$${salt}$${(hash as Buffer).toString('hex')}`;
}

async function seed() {
  const client = await pool.connect();

  const ADMIN_EMAIL = 'admin@fintab.vn';
  const ADMIN_PASSWORD = 'admin123456';
  const ADMIN_NAME = 'Fintab Admin';
  const TENANT_NAME = 'Fintab Vietnam';
  const ROLE = 'owner';

  try {
    await client.query('BEGIN');

    // Upsert tenant
    let tenantId: string;
    const existingTenant = await client.query('SELECT id FROM tenants WHERE name = $1', [TENANT_NAME]);
    if (existingTenant.rowCount && existingTenant.rowCount > 0) {
      tenantId = existingTenant.rows[0].id;
      console.log(`Tenant already exists: ${TENANT_NAME} (${tenantId})`);
    } else {
      const tenantRes = await client.query(
        'INSERT INTO tenants (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
        [TENANT_NAME]
      );
      tenantId = tenantRes.rows[0].id;
      console.log(`Created tenant: ${TENANT_NAME} (${tenantId})`);
    }

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    let userId: string;
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      userId = existingUser.rows[0].id;
      console.log(`User ${ADMIN_EMAIL} already exists (${userId}), updating...`);
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      await client.query(
        'UPDATE users SET name = $1, password_hash = $2, status = $3 WHERE id = $4',
        [ADMIN_NAME, passwordHash, 'active', userId]
      );
    } else {
      userId = randomBytes(16).toString('hex');
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      await client.query(
        'INSERT INTO users (id, email, name, password_hash, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [userId, ADMIN_EMAIL, ADMIN_NAME, passwordHash, 'active']
      );
      console.log(`Created user ${ADMIN_EMAIL}`);
    }

    // Upsert membership
    await client.query(
      `INSERT INTO memberships (id, user_id, tenant_id, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = EXCLUDED.role`,
      [randomBytes(16).toString('hex'), userId, tenantId, ROLE]
    );
    console.log(`Membership: ${ADMIN_EMAIL} -> ${TENANT_NAME} as ${ROLE}`);

    await client.query('COMMIT');
    console.log('\n✅ Seed complete!');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
