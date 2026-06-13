import { AppError } from '../../shared/http/errors.js';
import type { InvoiceBuyerRequest, InvoiceBuyerRequestInput } from './invoice-buyer-request.schema.js';
import { cleanText, isDemoInvoiceValue } from './invoice-request-normalizers.js';

const PAYMENT_METHODS = new Set(['AUTO', 'TM', 'CK', 'TM/CK', 'KHAC']);

export function validateInvoiceRequest(input: InvoiceBuyerRequestInput): void {
  const errors: string[] = [];
  if (input.buyerType === 'company') {
    errors.push(...getMissingCompanyInvoiceFields(input).map(field => `Thiếu ${field}.`));
  }
  if (input.buyerEmail && !isValidEmail(input.buyerEmail)) {
    errors.push('Email nhận hóa đơn không hợp lệ.');
  }
  if (input.paymentMethod && !PAYMENT_METHODS.has(input.paymentMethod)) {
    errors.push('Hình thức thanh toán không hợp lệ.');
  }
  if (input.taxRate !== null && input.taxRate !== undefined && (!Number.isFinite(Number(input.taxRate)) || Number(input.taxRate) < 0 || Number(input.taxRate) > 100)) {
    errors.push('Thuế suất không hợp lệ.');
  }
  if (errors.length > 0) throw new AppError('VALIDATION_ERROR', errors.join(' '), 400);
}

export function assertInvoiceRequestReadyForDraft(input: InvoiceBuyerRequestInput): void {
  const missing: string[] = [];
  if (!cleanText(input.buyerType)) missing.push('loại người mua');
  if (!input.confirmed) missing.push('xác nhận thông tin HĐ');
  if (!cleanText(input.buyerEmail)) missing.push('email nhận hóa đơn');
  if (input.buyerEmail && !isValidEmail(input.buyerEmail)) missing.push('email nhận hóa đơn hợp lệ');
  if (!cleanText(input.paymentMethod)) missing.push('hình thức thanh toán');
  if (!cleanText(input.templateCode)) missing.push('mẫu hóa đơn');
  if (!cleanText(input.invoiceSeries)) missing.push('ký hiệu hóa đơn');
  if (input.buyerType === 'company') missing.push(...getMissingCompanyInvoiceFields(input));
  const unique = [...new Set(missing)];
  if (unique.length > 0) {
    throw new AppError('VALIDATION_ERROR', `Vui lòng điền và xác nhận Thông tin HĐ trước khi tạo nháp. Thiếu: ${unique.join(', ')}.`, 400);
  }
}

export function getMissingCompanyInvoiceFields(input: InvoiceBuyerRequestInput): string[] {
  const missing: string[] = [];
  const taxCode = cleanText(input.taxCode);
  if (!taxCode) missing.push('mã số thuế');
  else if (!isValidTaxCode(taxCode)) missing.push('mã số thuế hợp lệ (10 hoặc 13 chữ số)');
  if (!cleanText(input.buyerUnitName) && !cleanText(input.legalName)) missing.push('tên pháp lý/tên đơn vị');
  if (!cleanText(input.invoiceAddress)) missing.push('địa chỉ xuất hóa đơn');
  return missing;
}

export function assertCompanyPayloadMatchesRequest(invoiceRequest: InvoiceBuyerRequestInput, payload: Record<string, unknown>): void {
  if (invoiceRequest.buyerType !== 'company') return;
  const buyer = typeof payload.buyer === 'object' && payload.buyer !== null ? payload.buyer as Record<string, unknown> : {};
  if (String(buyer.type ?? '').toLowerCase() !== 'company' || !cleanText(buyer.tax_code) || !cleanText(buyer.legal_name ?? buyer.name) || !cleanText(buyer.address)) {
    throw new AppError('VALIDATION_ERROR', 'Thông tin HĐ đang chọn Công ty nhưng payload thiếu MST, tên công ty/tên đơn vị hoặc địa chỉ.', 400, { wrongCompanyDraft: true });
  }
  if (!isValidTaxCode(buyer.tax_code)) {
    throw new AppError('VALIDATION_ERROR', 'Mã số thuế trên payload phải gồm 10 hoặc 13 chữ số hợp lệ.', 400);
  }
}

export function assertCompanyDraftMatchesRequest(invoiceRequest: InvoiceBuyerRequest, requestPayload: Record<string, unknown>): void {
  assertCompanyPayloadMatchesRequest(invoiceRequest, requestPayload);
}

export function isValidEmail(value: unknown): boolean {
  const text = cleanText(value);
  if (!text) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

export function isValidTaxCode(value: unknown): boolean {
  const taxCode = String(value ?? '').replace(/\s+/g, '');
  return /^\d{10}(\d{3})?$/.test(taxCode) && !isDemoInvoiceValue(taxCode);
}
