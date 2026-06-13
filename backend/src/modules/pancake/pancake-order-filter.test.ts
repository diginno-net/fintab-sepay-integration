import { describe, expect, it, vi } from 'vitest';
import { buildCompletedOrderQuery, buildOrderListQuery } from './pancake-order-filter.js';

describe('Pancake order filters', () => {
  it('builds completed order query compatible with Pancake POS', () => {
    vi.setSystemTime(new Date('2026-06-12T00:00:00.000Z'));

    const query = buildCompletedOrderQuery({ page: 2, page_size: 100, completedDays: 3 });

    expect(query).toMatchObject({
      page: 2,
      page_number: 2,
      page_size: 100,
      'filter_status[]': [3],
      updateStatus: 'updated_at',
      startDateTime: 1780963200,
      endDateTime: 1781222400,
      option_sort: 'updated_at_desc'
    });

    vi.useRealTimers();
  });

  it('uses explicit filter status array when completedOnly is false', () => {
    const query = buildOrderListQuery({ filterStatus: [3, 4], page: 1 });

    expect(query['filter_status[]']).toEqual([3, 4]);
    expect(query.status).toBeUndefined();
  });

  it('keeps scalar status fallback', () => {
    expect(buildOrderListQuery({ pancakeStatus: '3' })).toEqual({ status: '3' });
  });

  it('keeps legacy date filters when updateStatus is absent', () => {
    expect(buildOrderListQuery({ dateFrom: '2026-06-01', dateTo: '2026-06-12' })).toEqual({
      date_from: '2026-06-01',
      date_to: '2026-06-12'
    });
  });

  it('omits empty and undefined values', () => {
    expect(buildOrderListQuery({ search: '', page: undefined, dateFrom: undefined })).toEqual({});
  });
});
