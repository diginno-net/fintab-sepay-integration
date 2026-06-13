import { describe, expect, it } from 'vitest';
import { parsePancakeOrderPage } from './pancake-order-pagination.js';

describe('parsePancakeOrderPage', () => {
  it('parses data and snake_case pagination metadata', () => {
    const result = parsePancakeOrderPage({
      data: [{ id: '1' }],
      page_number: 2,
      page_size: 100,
      total_entries: 31650,
      total_pages: 317
    }, { page: 1, pageSize: 50 });

    expect(result.orders).toEqual([{ id: '1' }]);
    expect(result.pagination).toMatchObject({ page: 2, pageSize: 100, totalEntries: 31650, totalPages: 317, hasNextPage: true });
  });

  it('falls back when metadata is missing', () => {
    const result = parsePancakeOrderPage({ orders: [{ id: '1' }, { id: '2' }] }, { page: 1, pageSize: 50 });

    expect(result.pagination).toMatchObject({ page: 1, pageSize: 50, totalEntries: 2, totalPages: 1, hasNextPage: false });
  });
});
