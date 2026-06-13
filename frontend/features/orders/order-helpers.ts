export function extractOrderRows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
  if (typeof payload !== 'object' || payload === null) return [];
  const source = payload as Record<string, unknown>;
  if (Array.isArray(source.rows)) return source.rows as Array<Record<string, unknown>>;
  for (const key of ['orders', 'data', 'items']) {
    if (Array.isArray(source[key])) return source[key] as Array<Record<string, unknown>>;
  }
  return [];
}

export function orderId(order: Record<string, unknown>): string {
  return String(order.id ?? order.order_id ?? order.orderId ?? 'unknown');
}

export function orderStatus(order: Record<string, unknown>): string {
  return String(order.status_name ?? order.status ?? order.status_id ?? 'unknown');
}

export function orderCurrency(order: Record<string, unknown>): string {
  const currency = String(order.order_currency ?? order.currency ?? 'VND').trim().toUpperCase();
  return currency || 'VND';
}

export function formatMoney(value: unknown, currency = 'VND'): string {
  const numeric = Number(value ?? 0);
  const amount = Number.isFinite(numeric) ? numeric : 0;
  return `${amount.toLocaleString('vi-VN')} ${currency}`;
}

export function orderTotal(order: Record<string, unknown>): string {
  const value = order.total_price ?? order.total_price_after_sub_discount ?? order.total ?? 0;
  return formatMoney(value, orderCurrency(order));
}

export function orderDate(order: Record<string, unknown>): string {
  const d = order.inserted_at ?? order.created_at ?? order.updated_at;
  if (!d) return '';
  try { return new Date(String(d)).toLocaleString('vi-VN'); } catch { return String(d); }
}

export function orderCustomerName(order: Record<string, unknown>): string {
  const customer = order.customer;
  if (typeof customer === 'object' && customer !== null) {
    return String((customer as Record<string, unknown>).name ?? order.bill_full_name ?? 'Khách lẻ');
  }
  return String(order.bill_full_name ?? order.customer_name ?? 'Khách lẻ');
}
