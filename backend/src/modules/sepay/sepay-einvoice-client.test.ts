import { describe, expect, it } from 'vitest';
import { SepayEInvoiceClient } from './sepay-einvoice-client.js';

describe('SepayEInvoiceClient', () => {
  it('requests token with Basic auth', async () => {
    let authorization = '';
    const client = new SepayEInvoiceClient({
      env: 'sandbox',
      clientId: 'id',
      clientSecret: 'secret',
      fetchImpl: async (_input, init) => {
        authorization = String((init?.headers as Record<string, string>).Authorization);
        return new Response(JSON.stringify({ access_token: 'token', token_type: 'Bearer', expires_in: 86400 }), { status: 200 });
      }
    });

    const token = await client.getToken();

    expect(token.access_token).toBe('token');
    expect(authorization).toBe(`Basic ${Buffer.from('id:secret').toString('base64')}`);
  });
});
