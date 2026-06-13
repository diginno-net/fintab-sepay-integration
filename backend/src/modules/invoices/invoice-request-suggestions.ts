import { normalizeBuyer, normalizePaymentMethod } from '../pancake/pancake-normalizers.js';
import type { SepayShopConfig } from '../sepay/sepay.service.js';
import type { InvoiceBuyerRequestInput } from './invoice-buyer-request.schema.js';
import { cleanText } from './invoice-request-normalizers.js';

export type SuggestedInvoiceBuyerRequest = InvoiceBuyerRequestInput & {
  id: null;
  source: 'pancake';
  tenantId?: undefined;
  tenantShopId?: undefined;
  sourceOrderId?: undefined;
  createdAt?: undefined;
  updatedAt?: undefined;
};

export function buildSuggestedInvoiceRequestFromPancakeOrder(order: Record<string, unknown>, sepayConfig?: SepayShopConfig): SuggestedInvoiceBuyerRequest {
  const buyer = normalizeBuyer(order);
  const customer = objectRecord(order.customer);
  const companyInfo = objectRecord(customer.company_info ?? order.company_info);
  const companyName = cleanText(buyer.companyName ?? companyInfo.company_name ?? companyInfo.name ?? customer.company_name ?? order.company_name);
  const taxCode = cleanText(buyer.taxCode ?? companyInfo.tax_code ?? customer.tax_code ?? order.tax_code);
  const buyerType = taxCode || companyName ? 'company' : 'personal';

  return {
    id: null,
    source: 'pancake',
    buyerType,
    contactName: buyer.name,
    buyerEmail: buyer.email,
    buyerPhone: buyer.phone,
    invoiceAddress: buyer.address,
    taxCode: buyerType === 'company' ? taxCode : null,
    buyerUnitName: buyerType === 'company' ? companyName : null,
    legalName: buyerType === 'company' ? companyName : null,
    identityNumber: buyerType === 'personal' ? cleanText(buyer.identityNumber ?? customer.identity_code ?? customer.identity_number) : null,
    paymentMethod: sepayConfig?.default_payment_method ?? normalizePaymentMethod(order),
    templateCode: sepayConfig?.template_code ?? null,
    invoiceSeries: sepayConfig?.invoice_series ?? null,
    taxRate: sepayConfig?.default_tax_rate ?? null,
    notes: null,
    confirmed: false
  };
}

function objectRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}
