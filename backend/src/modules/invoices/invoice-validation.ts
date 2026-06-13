import { AppError } from '../../shared/http/errors.js';
import type { InvoicePreview } from './invoice-mapper.js';

const DEMO_TAX_CODES = new Set(['0312345678', '0302712571999', '0302712571', '0101234567']);

function isValidTaxCode(value: unknown): boolean {
  const text = String(value ?? '').replace(/\s+/g, '');
  return /^\d{10}(\d{3})?$/.test(text) && !DEMO_TAX_CODES.has(text);
}

function cleanText(value: unknown): string {
  return String(value ?? '').trim();
}

export function validateInvoicePreview(preview: InvoicePreview): void {
  if (!preview.payload.buyer.name) {
    throw new AppError('VALIDATION_ERROR', 'Buyer name is required', 400);
  }
  if (preview.payload.items.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Invoice must contain at least one item', 400);
  }
  const blockingWarning = preview.warnings.find(warning => warning.code === 'TAX_MAPPING_BLOCKED');
  if (blockingWarning) {
    throw new AppError('VALIDATION_ERROR', blockingWarning.message, 400, { warning: blockingWarning });
  }

  const buyer = preview.payload.buyer;
  const buyerType = String(buyer.type ?? '').toLowerCase();
  if (buyerType === 'company') {
    validateCompanyInvoice(buyer);
  }
}

function validateCompanyInvoice(buyer: Record<string, unknown>): void {
  const missing: string[] = [];

  const taxCode = cleanText(buyer.tax_code);
  if (!taxCode) {
    missing.push('mã số thuế');
  } else if (!isValidTaxCode(taxCode)) {
    throw new AppError('VALIDATION_ERROR', 'Mã số thuế phải gồm 10 hoặc 13 chữ số hợp lệ và không dùng mã demo', 400);
  }

  const legalName = cleanText(buyer.legal_name);
  const buyerUnitName = cleanText(buyer.buyer_unit_name);
  if (!legalName && !buyerUnitName) {
    missing.push('tên pháp lý/tên đơn vị');
  }

  const address = cleanText(buyer.address);
  if (!address) {
    missing.push('địa chỉ xuất hóa đơn');
  }

  if (missing.length > 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Hóa đơn công ty bắt buộc có mã số thuế, tên pháp lý/tên đơn vị và địa chỉ xuất hóa đơn. Thiếu: ${missing.join(', ')}.`,
      400
    );
  }
}

export function validateInvoiceRequestForDraft(invoiceRequest: Record<string, unknown>): void {
  const missing: string[] = [];

  if (!cleanText(invoiceRequest.buyerType)) missing.push('loại người mua (cá nhân/công ty)');

  const buyerType = String(invoiceRequest.buyerType ?? '').toLowerCase();
  const isCompany = buyerType === 'company';

  if (isCompany) {
    const taxCode = cleanText(invoiceRequest.taxCode);
    if (!taxCode) {
      missing.push('mã số thuế');
    } else if (!isValidTaxCode(taxCode)) {
      throw new AppError('VALIDATION_ERROR', 'Mã số thuế phải gồm 10 hoặc 13 chữ số hợp lệ', 400);
    }
    if (!cleanText(invoiceRequest.buyerUnitName || invoiceRequest.legalName)) {
      missing.push('tên pháp lý/tên đơn vị');
    }
    if (!cleanText(invoiceRequest.invoiceAddress)) {
      missing.push('địa chỉ xuất hóa đơn');
    }
  }

  if (missing.length > 0) {
    throw new AppError('VALIDATION_ERROR', `Vui lòng điền đầy đủ thông tin HĐ trước khi tạo nháp. Thiếu: ${missing.join(', ')}.`, 400);
  }
}
