import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('app foundation', () => {
  it('responds to health checks', async () => {
    const app = await buildApp();
    const response = await app.inject({ method: 'GET', url: '/v1/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ data: { status: 'ok' } });

    await app.close();
  });
});
