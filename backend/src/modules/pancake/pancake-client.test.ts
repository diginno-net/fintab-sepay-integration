import { describe, expect, it } from 'vitest';
import { PancakeClient } from './pancake-client.js';

describe('PancakeClient', () => {
  it('uses api_key query param and redacts it', () => {
    const client = new PancakeClient({ baseUrl: 'https://example.test/api/v1', shopId: 'shop-1', apiKey: 'secret' });
    const url = client.buildUrl('/shops/shop-1/orders', { query: { page_size: 1 } });
    expect(url.searchParams.get('api_key')).toBe('secret');
    expect(url.searchParams.get('page_size')).toBe('1');
    expect(client.redactUrl(url)).toContain('api_key=%5BREDACTED%5D');
  });

  it('appends array query params for Pancake filters', () => {
    const client = new PancakeClient({ baseUrl: 'https://example.test/api/v1', shopId: 'shop-1', apiKey: 'secret' });
    const url = client.buildUrl('/shops/shop-1/orders', { query: { 'filter_status[]': [3, 4] } });

    expect(url.searchParams.getAll('filter_status[]')).toEqual(['3', '4']);
  });
});
