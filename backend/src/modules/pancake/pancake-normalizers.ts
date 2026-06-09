export type NormalizedBuyer = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
};

export type NormalizedOrderItem = {
  productId: string | null;
  variationId: string | null;
  itemCode: string | null;
  itemName: string | null;
  barcode: string | null;
  quantity: number;
  unitPrice: number;
  totalDiscount: number;
  retailPrice: number;
  unit: string;
  note: string | null;
  variation_info: {
    display_id?: string | null;
    product_display_id?: string | null;
    barcode?: string | null;
    name?: string | null;
    product_name?: string | null;
    retail_price?: string | number | null;
    measure_info?: { name?: string | null };
  } | null;
};

export type NormalizedPayment = {
  totalPrice: number;
  totalPriceAfterDiscount: number;
  moneyToCollect: number;
  cod: number;
  cash: number;
  transferMoney: number;
  prepaid: number;
  shippingFee: number;
  surcharge: number;
  totalDiscount: number;
  currency: string;
};

export type NormalizedShippingAddress = {
  fullName: string | null;
  phone: string | null;
  address: string | null;
};

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeBuyer(order: Record<string, unknown>): NormalizedBuyer {
  const customer = typeof order.customer === 'object' && order.customer !== null
    ? order.customer as Record<string, unknown>
    : {};

  const shippingAddress = typeof order.shipping_address === 'object' && order.shipping_address !== null
    ? order.shipping_address as Record<string, unknown>
    : {};

  const phoneNumbers = Array.isArray(customer.phone_numbers) ? customer.phone_numbers : [];

  return {
    name: str(order.bill_full_name)
      ?? str(shippingAddress.full_name)
      ?? str(customer.name)
      ?? 'Khách lẻ',
    phone: str(order.bill_phone_number)
      ?? str(shippingAddress.phone_number)
      ?? (phoneNumbers[0] != null ? String(phoneNumbers[0]) : null),
    email: str(order.bill_email)
      ?? (Array.isArray(customer.emails) ? str(customer.emails[0]) : null),
    address: str(shippingAddress.full_address)
      ?? str(shippingAddress.address),
    taxCode: str(customer.tax_code ?? customer.identity_code)
      ?? str(order.tax_code)
      ?? null
  };
}

export function normalizeShippingAddress(order: Record<string, unknown>): NormalizedShippingAddress {
  const sa = typeof order.shipping_address === 'object' && order.shipping_address !== null
    ? order.shipping_address as Record<string, unknown>
    : {};
  const typedSa = sa as Record<string, unknown>;
  return {
    fullName: str(typedSa.full_name),
    phone: str(typedSa.phone_number),
    address: str(typedSa.full_address) ?? str(typedSa.address)
  };
}

export function normalizePayment(order: Record<string, unknown>): NormalizedPayment {
  return {
    totalPrice: num(order.total_price) ?? 0,
    totalPriceAfterDiscount: num(order.total_price_after_sub_discount) ?? num(order.total_price) ?? 0,
    moneyToCollect: num(order.money_to_collect) ?? 0,
    cod: num(order.cod) ?? 0,
    cash: num(order.cash) ?? 0,
    transferMoney: num(order.transfer_money ?? order.bank_transfer) ?? 0,
    prepaid: num(order.prepaid) ?? 0,
    shippingFee: num(order.shipping_fee) ?? 0,
    surcharge: num(order.surcharge) ?? 0,
    totalDiscount: num(order.total_discount) ?? 0,
    currency: str(order.order_currency) ?? 'VND'
  };
}

export function normalizeOrderItem(item: Record<string, unknown>): NormalizedOrderItem {
  const rawVi = item.variation_info;
  const vi = typeof rawVi === 'object' && rawVi !== null
    ? rawVi as Record<string, unknown>
    : {} as Record<string, unknown>;

  const displayId = str(vi.display_id ?? vi.product_display_id);
  const barcode = str(vi.barcode ?? item.barcode);
  const variationId = str(item.variation_id ?? item.variation_id);
  const productId = str(item.product_id);

  const viMeasureInfo = vi.measure_info as Record<string, unknown> | undefined;

  return {
    productId,
    variationId,
    itemCode: displayId ?? barcode ?? variationId ?? productId,
    itemName: str(vi.name ?? item.product_name ?? item.name),
    barcode,
    quantity: num(item.quantity) ?? 1,
    unitPrice: num(vi.retail_price ?? item.retail_price ?? item.price) ?? 0,
    totalDiscount: num(item.total_discount ?? item.discount_each_product) ?? 0,
    retailPrice: num(vi.retail_price) ?? num(item.retail_price) ?? 0,
    unit: str(viMeasureInfo?.name) ?? 'cái',
    note: str(item.note_product ?? item.note),
    variation_info: vi as NormalizedOrderItem['variation_info']
  };
}

export function normalizeOrderItems(order: Record<string, unknown>): NormalizedOrderItem[] {
  const items = order.items;
  if (!Array.isArray(items)) return [];
  return items.map(item => normalizeOrderItem(item as Record<string, unknown>));
}

export function normalizePaymentMethod(order: Record<string, unknown>): 'TM' | 'CK' | 'TM/CK' | 'KHAC' {
  const cash = num(order.cash) ?? 0;
  const transfer = num(order.transfer_money ?? order.bank_transfer) ?? 0;
  if (cash > 0 && transfer > 0) return 'TM/CK';
  if (transfer > 0) return 'CK';
  if (cash > 0) return 'TM';
  return 'TM/CK';
}
