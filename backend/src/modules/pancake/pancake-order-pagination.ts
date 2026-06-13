export type PancakeOrderPage = {
  orders: Array<Record<string, unknown>>;
  pagination: {
    page: number;
    pageSize: number;
    totalEntries: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

export function parsePancakeOrderPage(payload: unknown, fallback: { page: number; pageSize: number }): PancakeOrderPage {
  const source = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {};
  const orders = extractOrders(payload);
  const page = firstPositiveNumber(source.page, source.page_number, source.pageNumber) ?? fallback.page;
  const pageSize = firstPositiveNumber(source.page_size, source.pageSize) ?? fallback.pageSize;
  const totalEntries = firstNonNegativeNumber(source.total_entries, source.totalEntries, source.total) ?? orders.length;
  const totalPages = firstNonNegativeNumber(source.total_pages, source.totalPages) ?? Math.ceil(totalEntries / Math.max(pageSize, 1));

  return {
    orders,
    pagination: {
      page,
      pageSize,
      totalEntries,
      totalPages,
      hasNextPage: totalPages > 0 ? page < totalPages : orders.length >= pageSize
    }
  };
}

function extractOrders(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (typeof payload !== 'object' || payload === null) return [];
  const source = payload as Record<string, unknown>;
  for (const key of ['orders', 'data', 'items']) {
    const value = source[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstPositiveNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function firstNonNegativeNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return null;
}
