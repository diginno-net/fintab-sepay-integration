import { describe, expect, it } from 'vitest';
import { getInvoiceErrorInfo, isConfigError, type InvoiceErrorContext } from '../features/invoices/invoice-error-messages';

describe('getInvoiceErrorInfo', () => {
  function check(ctx: InvoiceErrorContext, title: string, hasActionLabel = false) {
    const info = getInvoiceErrorInfo(ctx);
    expect(info.title).toBe(title);
    if (hasActionLabel) {
      expect(info.actionLabel).toBeDefined();
    }
  }

  it('SEPAY_MISSING_CREDENTIALS → config error with link', () => {
    const info = getInvoiceErrorInfo({ code: 'SEPAY_MISSING_CREDENTIALS' });
    expect(info.title).toBe('Thiếu cấu hình SePay');
    expect(info.actionLabel).toBe('Cấu hình SePay');
    expect(info.actionHref).toBe('/settings/sepay');
    expect(info.actionType).toBe('link');
  });

  it('SEPAY_MISSING_PROVIDER_ACCOUNT → config error', () => {
    check({ code: 'SEPAY_MISSING_PROVIDER_ACCOUNT' }, 'Thiếu cấu hình SePay', true);
  });

  it('SEPAY_MISSING_INVOICE_SERIES → config error', () => {
    check({ code: 'SEPAY_MISSING_INVOICE_SERIES' }, 'Thiếu cấu hình SePay', true);
  });

  it('SEPAY_CONFIG_NOT_LOADED → config error', () => {
    check({ code: 'SEPAY_CONFIG_NOT_LOADED' }, 'Thiếu cấu hình SePay', true);
  });

  it('SEPAY_AUTH_FAILED → auth error', () => {
    const info = getInvoiceErrorInfo({ code: 'SEPAY_AUTH_FAILED' });
    expect(info.title).toBe('Xác thực SePay thất bại');
    expect(info.actionLabel).toBe('Cấu hình lại SePay');
    expect(info.actionHref).toBe('/settings/sepay');
  });

  it('SEPAY_TOKEN_ERROR → auth error', () => {
    check({ code: 'SEPAY_TOKEN_ERROR' }, 'Xác thực SePay thất bại', true);
  });

  it('SEPAY_API_ERROR → connection error', () => {
    const info = getInvoiceErrorInfo({ code: 'SEPAY_API_ERROR' });
    expect(info.title).toBe('Lỗi kết nối SePay');
    expect(info.actionLabel).toBe('Thử lại');
  });

  it('SEPAY_INVALID_TEMPLATE_SERIES → template error', () => {
    const info = getInvoiceErrorInfo({ code: 'SEPAY_INVALID_TEMPLATE_SERIES' });
    expect(info.title).toBe('Mẫu hóa đơn không hợp lệ');
    expect(info.actionLabel).toBe('Chọn lại template');
    expect(info.actionHref).toBe('/settings/sepay');
  });

  it('SEPAY_DRAFT_NOT_READY → not ready error', () => {
    const info = getInvoiceErrorInfo({ code: 'SEPAY_DRAFT_NOT_READY' });
    expect(info.title).toBe('Hóa đơn chưa sẵn sàng');
    expect(info.actionLabel).toBe('Làm mới');
  });

  it('SEPAY_INVOICE_NOT_FOUND → not ready error', () => {
    check({ code: 'SEPAY_INVOICE_NOT_FOUND' }, 'Hóa đơn chưa sẵn sàng');
  });

  it('SEPAY_DOWNLOAD_NOT_READY → not ready error', () => {
    check({ code: 'SEPAY_DOWNLOAD_NOT_READY' }, 'Hóa đơn chưa sẵn sàng');
  });

  it('SEPAY_CREATE_POLL_FAILED → poll error', () => {
    const info = getInvoiceErrorInfo({ code: 'SEPAY_CREATE_POLL_FAILED' });
    expect(info.title).toBe('Không lấy được thông tin hóa đơn');
    expect(info.actionLabel).toBe('Thử lại');
  });

  it('SEPAY_REFRESH_CREATE_FAILED → poll error', () => {
    check({ code: 'SEPAY_REFRESH_CREATE_FAILED' }, 'Không lấy được thông tin hóa đơn');
  });

  it('unknown code → generic error', () => {
    const info = getInvoiceErrorInfo({ code: 'UNKNOWN_CODE' });
    expect(info.title).toBe('Đã xảy ra lỗi');
    expect(info.actionLabel).toBe('Thử lại');
  });

  it('uses custom message when provided', () => {
    const info = getInvoiceErrorInfo({ code: 'SEPAY_API_ERROR', message: 'Custom error message' });
    expect(info.message).toBe('Custom error message');
  });
});

describe('isConfigError', () => {
  it('returns true for config errors', () => {
    expect(isConfigError('SEPAY_MISSING_CREDENTIALS')).toBe(true);
    expect(isConfigError('SEPAY_MISSING_PROVIDER_ACCOUNT')).toBe(true);
    expect(isConfigError('SEPAY_MISSING_INVOICE_SERIES')).toBe(true);
    expect(isConfigError('SEPAY_CONFIG_NOT_LOADED')).toBe(true);
  });

  it('returns false for non-config errors', () => {
    expect(isConfigError('SEPAY_API_ERROR')).toBe(false);
    expect(isConfigError('SEPAY_AUTH_FAILED')).toBe(false);
    expect(isConfigError('SEPAY_DRAFT_NOT_READY')).toBe(false);
  });
});
