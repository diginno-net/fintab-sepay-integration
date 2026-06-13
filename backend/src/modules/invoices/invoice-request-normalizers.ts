import type { InvoiceBuyerRequestInput } from './invoice-buyer-request.schema.js';

const DEMO_INVOICE_VALUES = new Set([
  'cong ty demo sepay',
  '0312345678',
  '0302712571999',
  '0302712571',
  '0101234567',
  '123 duong demo, tp hcm',
  '123 duong demo',
  'dia chi demo',
  '0900000000'
]);

export function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function cleanEmail(value: unknown): string | null {
  return cleanText(value)?.toLowerCase() ?? null;
}

export function cleanInvoiceOverride(value: unknown, options: { allowDemoText?: boolean } = {}): string | null {
  const text = cleanText(value);
  if (!text) return null;
  if (options.allowDemoText) return text;
  return isDemoInvoiceValue(text) ? null : text;
}

export function isDemoInvoiceValue(value: unknown): boolean {
  const text = normalizeComparableText(value);
  return DEMO_INVOICE_VALUES.has(text);
}

export function normalizeInvoiceRequestForProcessing(input: InvoiceBuyerRequestInput): InvoiceBuyerRequestInput {
  const buyerType = input.buyerType === 'company' ? 'company' : 'personal';
  const isCompany = buyerType === 'company';
  const buyerUnitName = cleanInvoiceOverride(input.buyerUnitName ?? input.legalName, { allowDemoText: true });
  const legalName = cleanInvoiceOverride(input.legalName ?? input.buyerUnitName, { allowDemoText: true });

  return {
    buyerType,
    contactName: cleanInvoiceOverride(input.contactName, { allowDemoText: true }),
    buyerEmail: cleanEmail(input.buyerEmail),
    buyerPhone: cleanText(input.buyerPhone),
    invoiceAddress: isCompany ? cleanInvoiceOverride(input.invoiceAddress) : cleanText(input.invoiceAddress),
    taxCode: isCompany ? cleanInvoiceOverride(input.taxCode) : null,
    buyerUnitName: isCompany ? buyerUnitName : null,
    legalName: isCompany ? legalName : null,
    identityNumber: isCompany ? null : cleanInvoiceOverride(input.identityNumber),
    paymentMethod: cleanText(input.paymentMethod),
    templateCode: cleanText(input.templateCode),
    invoiceSeries: cleanText(input.invoiceSeries),
    taxRate: input.taxRate ?? null,
    notes: cleanText(input.notes),
    confirmed: Boolean(input.confirmed)
  };
}

function normalizeComparableText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}
