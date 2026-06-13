import { resolveTaxForOrderItem, type OrderItemLike } from '../tax/tax-resolution.service.js';
import { normalizeBuyer, normalizeOrderItems, normalizePayment, normalizePaymentMethod } from '../pancake/pancake-normalizers.js';
import { type SepayShopConfig } from '../sepay/sepay.service.js';
import type { InvoiceBuyerRequestInput } from './invoice-buyer-request.schema.js';

export { normalizePaymentMethod as resolvePaymentMethod } from '../pancake/pancake-normalizers.js';

export type InvoiceType = 'gtgt' | 'ban_hang';

export type MappingWarning = {
  code: string;
  message: string;
  lineNumber?: number;
};

export type InvoicePreviewPayload = {
  provider_account_id: string;
  invoice_series: string;
  template_code: '1' | '2';
  currency: string;
  payment_method: 'TM' | 'CK' | 'TM/CK' | 'KHAC';
  issued_date: string;
  is_draft: true;
  reference_code: string;
  total_amount: number;
  buyer: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  notes?: string;
};

export type InvoicePreview = {
  payload: InvoicePreviewPayload;
  warnings: MappingWarning[];
  taxResolution: Array<Record<string, unknown>>;
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

export async function mapPancakeOrderToInvoicePreview(params: {
  tenantId: string;
  shopId: string;
  order: Record<string, unknown>;
  invoiceType: InvoiceType;
  sepayConfig?: SepayShopConfig;
  invoiceRequest?: InvoiceBuyerRequestInput;
}): Promise<InvoicePreview> {
  const warnings: MappingWarning[] = [];
  const orderItems = normalizeOrderItems(params.order);
  const payment = normalizePayment(params.order);
  const invoiceItems: Array<Record<string, unknown>> = [];
  const taxResolution: Array<Record<string, unknown>> = [];

  const sepayCfg = params.sepayConfig;
  const templateCode = resolveTemplateCode(params.invoiceRequest?.templateCode, sepayCfg?.template_code, params.invoiceType);
  if (sepayCfg) {
    if (!sepayCfg.has_credentials) {
      warnings.push({ code: 'SEPAY_MISSING_CREDENTIALS', message: 'SePay credentials (client ID / secret) chưa được cấu hình. Không thể phát hành hóa đơn.' });
    }
    if (!sepayCfg.provider_account_id) {
      warnings.push({ code: 'SEPAY_MISSING_PROVIDER_ACCOUNT', message: 'SePay provider account ID chưa được chọn. Vui lòng cấu hình SePay trong shop settings.' });
    }
    if (!sepayCfg.invoice_series) {
      warnings.push({ code: 'SEPAY_MISSING_INVOICE_SERIES', message: 'SePay invoice series chưa được cấu hình. Vui lòng cấu hình SePay trong shop settings.' });
    }
  } else {
    warnings.push({ code: 'SEPAY_CONFIG_NOT_LOADED', message: 'Không thể tải cấu hình SePay. Vui lòng thử lại.' });
  }

  for (const [index, item] of orderItems.entries()) {
    const lineNumber = index + 1;
    const tax = await resolveTaxForOrderItem(params.tenantId, params.shopId, item);
    for (const warning of tax.warnings) {
      warnings.push({ code: 'TAX_MAPPING_WARNING', message: warning, lineNumber });
    }
    if (tax.shouldBlock) {
      warnings.push({ code: 'TAX_MAPPING_BLOCKED', message: 'Tax profile is required by shop policy', lineNumber });
    }
    taxResolution.push({ lineNumber, source: tax.source, taxRate: tax.taxRate, shouldBlock: tax.shouldBlock, productId: tax.product?.id ?? null });

    if (!item.itemName) {
      warnings.push({ code: 'ITEM_NAME_MISSING', message: `Line ${lineNumber}: Product name is empty`, lineNumber });
    }
    if (item.unitPrice === 0) {
      warnings.push({ code: 'UNIT_PRICE_ZERO', message: `Line ${lineNumber}: Unit price is 0`, lineNumber });
    }

    const beforeDiscountAmount = roundCurrency(item.quantity * item.unitPrice);
    const discountAmount = roundCurrency(item.totalDiscount);
    const linePayload: Record<string, unknown> = {
      line_number: lineNumber,
      line_type: tax.invoiceLineType,
      item_code: tax.product?.source_product_code ?? item.itemCode ?? `ITEM-${lineNumber}`,
      item_name: tax.product?.product_name ?? item.itemName ?? `Sản phẩm ${lineNumber}`,
      unit: tax.invoiceUnit,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      before_discount_and_tax_amount: beforeDiscountAmount,
      ...(discountAmount > 0 ? { discount_amount: discountAmount } : {}),
      ...(shouldIncludeTaxRate(templateCode) ? { tax_rate: resolveItemTaxRate(params.invoiceRequest?.taxRate, tax.taxRate) } : {})
    };
    invoiceItems.push(linePayload);
  }

  const buyer = normalizeBuyer(params.order);
  const buyerAddresses = normalizeBuyerAddresses(params.order);
  const buyerPayload = buildBuyerPayload(params.invoiceRequest, buyer, buyerAddresses, params.order);
  if (!buyerPayload.name || buyerPayload.name === 'Khách lẻ') {
    warnings.push({ code: 'BUYER_NAME_DEFAULT', message: 'Buyer name is "Khách lẻ" — might be missing in Pancake' });
  }
  if (!buyerPayload.phone) {
    warnings.push({ code: 'BUYER_PHONE_MISSING', message: 'Buyer phone number is missing' });
  }
  if (!buyerPayload.email) {
    warnings.push({ code: 'BUYER_EMAIL_MISSING', message: 'Buyer email is missing' });
  }

  const paymentMethod = resolvePaymentMethodOverride(
    params.invoiceRequest?.paymentMethod,
    sepayCfg?.default_payment_method,
    normalizePaymentMethod(params.order)
  );
  const invoiceSeries = str(params.invoiceRequest?.invoiceSeries ?? sepayCfg?.invoice_series) ?? '';
  const notes = str(params.invoiceRequest?.notes ?? params.order.note ?? params.order.note_print) ?? undefined;

  const issuedDate = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const calculatedTotal = invoiceItems.reduce((sum, item) => {
    const quantity = num(item.quantity) ?? 0;
    const unitPrice = num(item.unit_price) ?? 0;
    const discount = num(item.discount_amount) ?? 0;
    return sum + quantity * unitPrice - discount;
  }, 0);
  const totalAmount = payment.totalPriceAfterDiscount > 0 ? payment.totalPriceAfterDiscount : calculatedTotal;

  return {
    payload: {
      provider_account_id: sepayCfg?.provider_account_id ?? '',
      invoice_series: invoiceSeries,
      template_code: templateCode,
      currency: payment.currency,
      payment_method: paymentMethod,
      issued_date: issuedDate,
      is_draft: true,
      reference_code: createReferenceCode(params.shopId, params.order),
      total_amount: roundCurrency(totalAmount),
      buyer: compactObject(buyerPayload),
      items: invoiceItems,
      notes
    },
    warnings,
    taxResolution
  };
}

function resolveTemplateCode(invoiceRequestTemplate: string | null | undefined, configuredTemplate: string | null | undefined, invoiceType: InvoiceType): '1' | '2' {
  if (invoiceRequestTemplate === '1' || invoiceRequestTemplate === '2') return invoiceRequestTemplate;
  if (configuredTemplate === '1' || configuredTemplate === '2') return configuredTemplate;
  return invoiceType === 'gtgt' ? '1' : '2';
}

function shouldIncludeTaxRate(templateCode: string): boolean {
  return templateCode === '1';
}

function resolveItemTaxRate(invoiceRequestTaxRate: number | null | undefined, fallbackTaxRate: number | null | undefined): number {
  if (invoiceRequestTaxRate !== null && invoiceRequestTaxRate !== undefined) return invoiceRequestTaxRate;
  return fallbackTaxRate ?? 10;
}

function roundCurrency(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function createReferenceCode(shopId: string, order: Record<string, unknown>): string {
  const sourceId = str(order.id ?? order.system_id ?? order.order_number ?? order.reference_code) ?? 'unknown';
  return `PANCAKE-${shopId.slice(0, 8)}-${sourceId}`.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 64);
}

function resolvePaymentMethodOverride(
  invoiceRequestMethod: string | null | undefined,
  configuredMethod: string | null | undefined,
  fallback: string
): 'TM' | 'CK' | 'TM/CK' | 'KHAC' {
  if (typeof invoiceRequestMethod === 'string' && invoiceRequestMethod !== '' && invoiceRequestMethod !== 'AUTO') {
    return invoiceRequestMethod as 'TM' | 'CK' | 'TM/CK' | 'KHAC';
  }
  if (typeof configuredMethod === 'string' && configuredMethod !== '' && configuredMethod !== 'AUTO') {
    return configuredMethod as 'TM' | 'CK' | 'TM/CK' | 'KHAC';
  }
  return fallback as 'TM' | 'CK' | 'TM/CK' | 'KHAC';
}

export function extractOrderItems(order: Record<string, unknown>): OrderItemLike[] {
  const candidates = [order.items, order.order_items, order.products, order.variations];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as OrderItemLike[];
  }
  return [];
}

type NormalizedBuyerAddresses = {
  shippingFullAddress: string | null;
  shippingAddress: string | null;
  customerFullAddress: string | null;
  customerAddress: string | null;
  buyerAddress: string | null;
  billingFullAddress: string | null;
  billingAddress: string | null;
  billAddress: string | null;
};

export function normalizeBuyerAddresses(order: Record<string, unknown>): NormalizedBuyerAddresses {
  const shipping = typeof order.shipping_address === 'object' && order.shipping_address !== null
    ? order.shipping_address as Record<string, unknown> : {};
  const customer = typeof order.customer === 'object' && order.customer !== null
    ? order.customer as Record<string, unknown> : {};
  const billAddress = typeof order.bill_address === 'object' && order.bill_address !== null
    ? order.bill_address as Record<string, unknown> : {};
  const billing = typeof order.billing_address === 'object' && order.billing_address !== null
    ? order.billing_address as Record<string, unknown> : {};

  const buyerRecord = (typeof order.buyer === 'object' && order.buyer !== null) ? order.buyer as Record<string, unknown> : {};
  return {
    shippingFullAddress: str(shipping.full_address),
    shippingAddress: str(shipping.address),
    customerFullAddress: str(customer.full_address),
    customerAddress: str(customer.address),
    buyerAddress: str(buyerRecord.address),
    billingFullAddress: str(billing.full_address),
    billingAddress: str(billing.address),
    billAddress: str(billAddress.address)
  };
}

function buildBuyerPayload(
  invoiceRequest: InvoiceBuyerRequestInput | undefined,
  pancakeBuyer: { name: string; phone: string | null; email: string | null; address: string | null; taxCode: string | null; identityNumber?: string | null },
  addresses: NormalizedBuyerAddresses,
  order: Record<string, unknown>
): Record<string, unknown> {
  if (!invoiceRequest) {
    const nationalId = sepayNationalId(pancakeBuyer.identityNumber);
    return {
      name: pancakeBuyer.name,
      phone: pancakeBuyer.phone,
      email: pancakeBuyer.email,
      address: pancakeBuyer.address,
      tax_code: pancakeBuyer.taxCode,
      national_id: nationalId,
      identity_number: nationalId
    };
  }

  const isCompany = invoiceRequest.buyerType === 'company';

  if (isCompany) {
    const companyName = invoiceRequest.buyerUnitName || invoiceRequest.legalName || pancakeBuyer.name;
    const contactName = invoiceRequest.contactName || companyName;
    const buyerRecord = (typeof order.buyer === 'object' && order.buyer !== null) ? order.buyer as Record<string, unknown> : {};
    const customerRecord = (typeof order.customer === 'object' && order.customer !== null) ? order.customer as Record<string, unknown> : {};
    return {
      type: 'company',
      name: contactName,
      legal_name: invoiceRequest.legalName || invoiceRequest.buyerUnitName || null,
      tax_code: invoiceRequest.taxCode || null,
      address: resolveInvoiceAddress(invoiceRequest, addresses),
      email: invoiceRequest.buyerEmail || pancakeBuyer.email,
      phone: invoiceRequest.buyerPhone || pancakeBuyer.phone,
      buyer_code: str(buyerRecord.buyer_code ?? customerRecord.id ?? null)
    };
  }

  const buyerRecord = (typeof order.buyer === 'object' && order.buyer !== null) ? order.buyer as Record<string, unknown> : {};
  const customerRecord = (typeof order.customer === 'object' && order.customer !== null) ? order.customer as Record<string, unknown> : {};
  const nationalId = sepayNationalId(invoiceRequest.identityNumber);
  return {
    type: 'personal',
    name: invoiceRequest.contactName || pancakeBuyer.name,
    identity_number: nationalId,
    national_id: nationalId,
    address: resolvePersonalAddress(invoiceRequest, addresses),
    email: invoiceRequest.buyerEmail || pancakeBuyer.email,
    phone: invoiceRequest.buyerPhone || pancakeBuyer.phone,
    buyer_code: str(buyerRecord.buyer_code ?? customerRecord.id ?? null)
  };
}

function sepayNationalId(value: string | null | undefined): string | null {
  const text = str(value);
  if (!text) return null;
  return text.length <= 12 ? text : null;
}

function compactObject(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== null && value !== undefined && value !== ''));
}

function resolveInvoiceAddress(
  invoiceRequest: InvoiceBuyerRequestInput,
  addresses: NormalizedBuyerAddresses
): string | null {
  return str(invoiceRequest.invoiceAddress)
    ?? addresses.shippingFullAddress
    ?? addresses.shippingAddress
    ?? addresses.customerFullAddress
    ?? addresses.customerAddress
    ?? addresses.buyerAddress
    ?? addresses.billingFullAddress
    ?? addresses.billingAddress
    ?? addresses.billAddress
    ?? null;
}

function resolvePersonalAddress(
  invoiceRequest: InvoiceBuyerRequestInput,
  addresses: NormalizedBuyerAddresses
): string | null {
  return addresses.shippingFullAddress
    ?? addresses.shippingAddress
    ?? addresses.customerFullAddress
    ?? addresses.customerAddress
    ?? addresses.buyerAddress
    ?? addresses.billingFullAddress
    ?? addresses.billingAddress
    ?? addresses.billAddress
    ?? null;
}
