export type PancakeOrder = {
  id: number;
  shop_id: number;
  system_id: number;
  status: number;
  status_name: string;
  sub_status: string | null;
  inserted_at: string;
  updated_at: string;
  order_link: string;
  note: string | null;
  note_print: string | null;
  tags: Array<{ id: number; name: string }>;
  bill_full_name: string | null;
  bill_phone_number: string | null;
  bill_email: string | null;
  total_price: number;
  total_price_after_sub_discount: number;
  money_to_collect: number;
  cod: number;
  cash: number;
  transfer_money: number;
  prepaid: number;
  shipping_fee: number;
  surcharge: number;
  total_discount: number;
  order_currency: string;
  customer: {
    id: string;
    name: string;
    phone_numbers: string[];
    emails: string[];
    tax_code?: string;
    identity_code?: string;
    address?: string;
  };
  shipping_address: {
    full_name: string | null;
    phone_number: string | null;
    full_address: string | null;
    address: string | null;
  };
  items: PancakeOrderItem[];
};

export type PancakeOrderItem = {
  id: number;
  product_id: string;
  variation_id: string;
  quantity: number;
  discount_each_product: number;
  total_discount: number;
  note_product: string | null;
  variation_info: {
    display_id: string;
    product_display_id: string;
    name: string;
    barcode: string;
    retail_price: number;
    tax_rate: number;
    weight: number;
    measure_info?: { name: string };
  };
};

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t || null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const p = Number(v);
  return Number.isFinite(p) ? p : null;
}

export function extractBuyer(order: PancakeOrder): {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
} {
  const shipping = order.shipping_address ?? {};
  const customer = order.customer ?? {};
  const phoneNumbers = Array.isArray(customer.phone_numbers) ? customer.phone_numbers : [];
  return {
    name: str(order.bill_full_name) ?? str(shipping.full_name) ?? str(customer.name) ?? 'Khách lẻ',
    phone: str(order.bill_phone_number) ?? str(shipping.phone_number) ?? phoneNumbers[0] ?? null,
    email: str(order.bill_email) ?? (Array.isArray(customer.emails) ? str(customer.emails[0]) : null),
    address: str(shipping.full_address) ?? str(shipping.address) ?? str(customer.address) ?? null,
    taxCode: str(customer.tax_code ?? customer.identity_code) ?? null
  };
}

export function extractPayment(order: PancakeOrder): {
  totalPrice: string;
  afterDiscount: string;
  moneyToCollect: string;
  cod: string;
  cash: string;
  transfer: string;
  prepaid: string;
  shippingFee: string;
  surcharge: string;
  totalDiscount: string;
  currency: string;
} {
  const f = (v: number | null) => (v !== null ? v.toLocaleString('vi-VN') : '0');
  return {
    totalPrice: f(num(order.total_price)),
    afterDiscount: f(num(order.total_price_after_sub_discount)),
    moneyToCollect: f(num(order.money_to_collect)),
    cod: f(num(order.cod)),
    cash: f(num(order.cash)),
    transfer: f(num(order.transfer_money)),
    prepaid: f(num(order.prepaid)),
    shippingFee: f(num(order.shipping_fee)),
    surcharge: f(num(order.surcharge)),
    totalDiscount: f(num(order.total_discount)),
    currency: str(order.order_currency) ?? 'VND'
  };
}

export function extractOrderInfo(order: PancakeOrder): {
  id: string;
  systemId: string;
  status: string;
  statusName: string;
  insertedAt: string;
  updatedAt: string;
  orderLink: string | null;
  note: string | null;
  notePrint: string | null;
  tags: string;
} {
  return {
    id: String(order.id),
    systemId: String(order.system_id ?? order.id),
    status: String(order.status),
    statusName: str(order.status_name) ?? 'unknown',
    insertedAt: str(order.inserted_at) ?? '',
    updatedAt: str(order.updated_at) ?? '',
    orderLink: str(order.order_link) ?? null,
    note: str(order.note) ?? null,
    notePrint: str(order.note_print) ?? null,
    tags: Array.isArray(order.tags) ? order.tags.map((t: { name: string }) => t.name).join(', ') : ''
  };
}

export function extractItems(order: PancakeOrder): Array<{
  id: string;
  productId: string;
  variationId: string;
  name: string;
  displayId: string;
  barcode: string;
  quantity: string;
  unitPrice: string;
  totalDiscount: string;
  taxRate: string;
  unit: string;
  note: string | null;
}> {
  if (!Array.isArray(order.items)) return [];
  return order.items.map((item: PancakeOrderItem) => {
    const vi = item.variation_info ?? {};
    return {
      id: String(item.id),
      productId: str(item.product_id) ?? '',
      variationId: str(item.variation_id) ?? '',
      name: str(vi.name) ?? 'Không có tên',
      displayId: str(vi.display_id ?? vi.product_display_id) ?? '',
      barcode: str(vi.barcode) ?? '',
      quantity: String(item.quantity ?? 1),
      unitPrice: (vi.retail_price ?? 0).toLocaleString('vi-VN'),
      totalDiscount: (item.total_discount ?? 0).toLocaleString('vi-VN'),
      taxRate: String(vi.tax_rate ?? 0),
      unit: str(vi.measure_info?.name) ?? 'cái',
      note: str(item.note_product) ?? null
    };
  });
}

export function extractShippingAddress(order: PancakeOrder): {
  fullName: string | null;
  phone: string | null;
  address: string | null;
} {
  const sa = order.shipping_address ?? {};
  return {
    fullName: str(sa.full_name) ?? null,
    phone: str(sa.phone_number) ?? null,
    address: str(sa.full_address) ?? str(sa.address) ?? null
  };
}
