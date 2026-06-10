export function extractOrderRows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
  if (typeof payload !== 'object' || payload === null) return [];
  const source = payload as Record<string, unknown>;
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

export function orderTotal(order: Record<string, unknown>): string {
  const value = Number(order.total_price ?? order.total ?? order.money_to_collect ?? 0);
  return Number.isFinite(value) ? value.toLocaleString('vi-VN') : '0';
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
