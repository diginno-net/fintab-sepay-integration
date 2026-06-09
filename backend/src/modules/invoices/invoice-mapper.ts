import { resolveTaxForOrderItem, type OrderItemLike } from '../tax/tax-resolution.service.js';
import { normalizeBuyer, normalizeOrderItems, normalizePaymentMethod } from '../pancake/pancake-normalizers.js';
import { type SepayShopConfig } from '../sepay/sepay.service.js';

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
  currency: 'VND';
  payment_method: 'TM' | 'CK' | 'TM/CK' | 'KHAC';
  issued_date: string;
  is_draft: true;
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
}): Promise<InvoicePreview> {
  const warnings: MappingWarning[] = [];
  const orderItems = normalizeOrderItems(params.order);
  const invoiceItems: Array<Record<string, unknown>> = [];
  const taxResolution: Array<Record<string, unknown>> = [];

  const sepayCfg = params.sepayConfig;
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

    invoiceItems.push({
      line_number: lineNumber,
      line_type: tax.invoiceLineType,
      item_code: tax.product?.source_product_code ?? item.itemCode ?? `ITEM-${lineNumber}`,
      item_name: tax.product?.product_name ?? item.itemName ?? `Sản phẩm ${lineNumber}`,
      unit: tax.invoiceUnit,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      ...(params.invoiceType === 'gtgt' ? { tax_rate: tax.taxRate ?? 10 } : {})
    });
  }

  const buyer = normalizeBuyer(params.order);
  if (!buyer.name || buyer.name === 'Khách lẻ') {
    warnings.push({ code: 'BUYER_NAME_DEFAULT', message: 'Buyer name is "Khách lẻ" — might be missing in Pancake' });
  }
  if (!buyer.phone) {
    warnings.push({ code: 'BUYER_PHONE_MISSING', message: 'Buyer phone number is missing' });
  }
  if (!buyer.email) {
    warnings.push({ code: 'BUYER_EMAIL_MISSING', message: 'Buyer email is missing' });
  }

  const templateCode = resolveTemplateCode(sepayCfg?.template_code, params.invoiceType);
  const paymentMethod = resolvePaymentMethodOverride(sepayCfg?.default_payment_method, normalizePaymentMethod(params.order));

  const issuedDate = new Date().toISOString().replace('T', ' ').slice(0, 19);

  return {
    payload: {
      provider_account_id: sepayCfg?.provider_account_id ?? '',
      invoice_series: sepayCfg?.invoice_series ?? '',
      template_code: templateCode,
      currency: 'VND',
      payment_method: paymentMethod,
      issued_date: issuedDate,
      is_draft: true,
      buyer: {
        name: buyer.name,
        phone: buyer.phone,
        email: buyer.email,
        address: buyer.address,
        tax_code: buyer.taxCode
      },
      items: invoiceItems,
      notes: str(params.order.note ?? params.order.note_print) ?? undefined
    },
    warnings,
    taxResolution
  };
}

function resolveTemplateCode(configuredTemplate: string | null | undefined, invoiceType: InvoiceType): '1' | '2' {
  if (configuredTemplate === '1' || configuredTemplate === '2') return configuredTemplate;
  return invoiceType === 'gtgt' ? '1' : '2';
}

function resolvePaymentMethodOverride(configured: string | null | undefined, fallback: string): 'TM' | 'CK' | 'TM/CK' | 'KHAC' {
  if (typeof configured === 'string' && configured !== '' && configured !== 'AUTO') return configured as 'TM' | 'CK' | 'TM/CK' | 'KHAC';
  return fallback as 'TM' | 'CK' | 'TM/CK' | 'KHAC';
}

export function extractOrderItems(order: Record<string, unknown>): OrderItemLike[] {
  const candidates = [order.items, order.order_items, order.products, order.variations];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as OrderItemLike[];
  }
  return [];
}
