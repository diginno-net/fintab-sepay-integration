import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('origin guard', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('does not block configured origin for mutating requests', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { origin: 'http://localhost:3000' },
      payload: { email: 'missing@example.com', password: 'wrong' }
    });
    expect(res.statusCode).not.toBe(403);
  });

  it('rejects disallowed origin for mutating requests', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { origin: 'https://evil.example' },
      payload: { email: 'missing@example.com', password: 'wrong' }
    });
    expect(res.statusCode).toBe(403);
  });

  it('does not block safe methods', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/health', headers: { origin: 'https://evil.example' } });
    expect(res.statusCode).toBe(200);
  });
});
