import { describe, expect, it } from 'vitest';
import {
  extractToken,
  extractTrackingCode,
  extractReferenceCode,
  extractInvoiceNumber,
  extractStatus,
  normalizeStatus,
  isSuccessStatus,
  isFailedStatus,
  extractMessage,
  extractDownloadUrl,
  buildPollResult,
} from './sepay-response-utils.js';

describe('extractToken', () => {
  it('extracts token from direct shape', () => {
    const body = { access_token: 'abc123', token_type: 'Bearer', expires_in: 86400 };
    const result = extractToken(body);
    expect(result).toEqual({ access_token: 'abc123', token_type: 'Bearer', expires_in: 86400 });
  });

  it('extracts token from data envelope shape', () => {
    const body = { data: { access_token: 'xyz789', token_type: 'Bearer', expires_in: 3600 } };
    const result = extractToken(body);
    expect(result).toEqual({ access_token: 'xyz789', token_type: 'Bearer', expires_in: 3600 });
  });

  it('returns null when no access_token', () => {
    expect(extractToken(null)).toBeNull();
    expect(extractToken(undefined)).toBeNull();
    expect(extractToken({})).toBeNull();
    expect(extractToken({ data: {} })).toBeNull();
    expect(extractToken({ access_token: '' })).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(extractToken('string')).toBeNull();
    expect(extractToken(123)).toBeNull();
  });
});

describe('extractTrackingCode', () => {
  it('extracts tracking_code from root', () => {
    const body = { tracking_code: 'TC001', status: 'success' };
    const result = extractTrackingCode(body);
    expect(result?.trackingCode).toBe('TC001');
    expect(result?.status).toBe('success');
  });

  it('extracts tracking_code from data envelope', () => {
    const body = { data: { tracking_code: 'TC002', message: 'OK' } };
    const result = extractTrackingCode(body);
    expect(result?.trackingCode).toBe('TC002');
    expect(result?.message).toBe('OK');
  });

  it('extracts trackingCode (camelCase) from root', () => {
    const body = { trackingCode: 'TC003' };
    const result = extractTrackingCode(body);
    expect(result?.trackingCode).toBe('TC003');
  });

  it('returns null when no tracking code', () => {
    expect(extractTrackingCode(null)).toBeNull();
    expect(extractTrackingCode({})).toBeNull();
    expect(extractTrackingCode({ status: 'pending' })).toBeNull();
  });
});

describe('extractReferenceCode', () => {
  it('extracts reference_code from root', () => {
    const body = { reference_code: 'REF001' };
    expect(extractReferenceCode(body)).toBe('REF001');
  });

  it('extracts reference_code from data envelope', () => {
    const body = { data: { reference_code: 'REF002' } };
    expect(extractReferenceCode(body)).toBe('REF002');
  });

  it('extracts reference_code from nested invoice', () => {
    const body = { data: { invoice: { reference_code: 'REF003' } } };
    expect(extractReferenceCode(body)).toBe('REF003');
  });

  it('returns empty string when not found', () => {
    expect(extractReferenceCode(null)).toBe('');
    expect(extractReferenceCode({})).toBe('');
    expect(extractReferenceCode({ data: {} })).toBe('');
  });

  it('prefers earlier response in array', () => {
    const a = { reference_code: 'REF_A' };
    const b = { reference_code: 'REF_B' };
    expect(extractReferenceCode(a, b)).toBe('REF_A');
    expect(extractReferenceCode(b, a)).toBe('REF_B');
  });
});

describe('extractInvoiceNumber', () => {
  it('extracts invoice_number from root', () => {
    const body = { invoice_number: 'INV001' };
    expect(extractInvoiceNumber(body)).toBe('INV001');
  });

  it('extracts invoice_number from data envelope', () => {
    const body = { data: { invoice_number: 'INV002' } };
    expect(extractInvoiceNumber(body)).toBe('INV002');
  });

  it('extracts invoice_number from nested invoice', () => {
    const body = { data: { invoice: { invoice_number: 'INV003' } } };
    expect(extractInvoiceNumber(body)).toBe('INV003');
  });

  it('returns empty string when not found', () => {
    expect(extractInvoiceNumber(null)).toBe('');
    expect(extractInvoiceNumber({})).toBe('');
  });
});

describe('extractStatus', () => {
  it('extracts status from root', () => {
    const body = { status: 'success' };
    expect(extractStatus(body)).toBe('success');
  });

  it('extracts status from data envelope', () => {
    const body = { data: { status: 'pending' } };
    expect(extractStatus(body)).toBe('pending');
  });

  it('extracts state from data envelope as fallback', () => {
    const body = { data: { state: 'processing' } };
    expect(extractStatus(body)).toBe('processing');
  });

  it('returns empty string when not found', () => {
    expect(extractStatus(null)).toBe('');
    expect(extractStatus({})).toBe('');
  });
});

describe('normalizeStatus', () => {
  it('trims and lowercases', () => {
    expect(normalizeStatus('  Success  ')).toBe('success');
    expect(normalizeStatus('PENDING')).toBe('pending');
  });

  it('handles empty input', () => {
    expect(normalizeStatus('')).toBe('');
    expect(normalizeStatus('   ')).toBe('');
  });
});

describe('isSuccessStatus', () => {
  it('returns true for success variants', () => {
    expect(isSuccessStatus('success')).toBe(true);
    expect(isSuccessStatus('Succeeded')).toBe(true);
    expect(isSuccessStatus('done')).toBe(true);
    expect(isSuccessStatus('  completed  ')).toBe(true);
  });

  it('returns false for non-success', () => {
    expect(isSuccessStatus('pending')).toBe(false);
    expect(isSuccessStatus('failed')).toBe(false);
    expect(isSuccessStatus('')).toBe(false);
  });
});

describe('isFailedStatus', () => {
  it('returns true for failure variants', () => {
    expect(isFailedStatus('failed')).toBe(true);
    expect(isFailedStatus('Fail')).toBe(true);
    expect(isFailedStatus('error')).toBe(true);
    expect(isFailedStatus('  rejected  ')).toBe(true);
  });

  it('returns false for non-failure', () => {
    expect(isFailedStatus('pending')).toBe(false);
    expect(isFailedStatus('success')).toBe(false);
    expect(isFailedStatus('')).toBe(false);
  });
});

describe('extractMessage', () => {
  it('extracts message from root', () => {
    const body = { message: 'Operation successful' };
    expect(extractMessage(body)).toBe('Operation successful');
  });

  it('extracts message from data envelope', () => {
    const body = { data: { message: 'Done' } };
    expect(extractMessage(body)).toBe('Done');
  });

  it('extracts nested error message', () => {
    const body = { error: { message: 'Something went wrong' } };
    expect(extractMessage(body)).toBe('Something went wrong');
  });

  it('returns empty string when not found', () => {
    expect(extractMessage(null)).toBe('');
    expect(extractMessage({})).toBe('');
    expect(extractMessage({ data: {} })).toBe('');
  });
});

describe('extractDownloadUrl', () => {
  it('extracts pdf_url from root', () => {
    const body = { pdf_url: 'https://sepay.io/invoice.pdf' };
    expect(extractDownloadUrl(body, 'pdf')).toBe('https://sepay.io/invoice.pdf');
  });

  it('extracts pdf_url from data envelope', () => {
    const body = { data: { pdf_url: 'https://sepay.io/doc.pdf' } };
    expect(extractDownloadUrl(body, 'pdf')).toBe('https://sepay.io/doc.pdf');
  });

  it('extracts pdfUrl (camelCase) from data', () => {
    const body = { data: { pdfUrl: 'https://sepay.io/camel.pdf' } };
    expect(extractDownloadUrl(body, 'pdf')).toBe('https://sepay.io/camel.pdf');
  });

  it('extracts xml_url from root', () => {
    const body = { xml_url: 'https://sepay.io/invoice.xml' };
    expect(extractDownloadUrl(body, 'xml')).toBe('https://sepay.io/invoice.xml');
  });

  it('extracts xmlUrl (camelCase) from data', () => {
    const body = { data: { xmlUrl: 'https://sepay.io/camel.xml' } };
    expect(extractDownloadUrl(body, 'xml')).toBe('https://sepay.io/camel.xml');
  });

  it('returns empty string when not found', () => {
    expect(extractDownloadUrl(null, 'pdf')).toBe('');
    expect(extractDownloadUrl({}, 'pdf')).toBe('');
    expect(extractDownloadUrl({ data: {} }, 'pdf')).toBe('');
  });
});

describe('buildPollResult', () => {
  it('builds correct PollResult from data envelope with success', () => {
    const body = {
      data: {
        status: 'success',
        tracking_code: 'TC001',
        reference_code: 'REF001',
        invoice_number: 'INV001',
        message: 'Done'
      }
    };
    const result = buildPollResult(body);
    expect(result.status).toBe('success');
    expect(result.trackingCode).toBe('TC001');
    expect(result.referenceCode).toBe('REF001');
    expect(result.invoiceNumber).toBe('INV001');
    expect(result.message).toBe('Done');
    expect(result.success).toBe(true);
    expect(result.failed).toBe(false);
  });

  it('builds correct PollResult for failed status', () => {
    const body = {
      data: {
        status: 'failed',
        tracking_code: 'TC001',
        message: 'Error occurred'
      }
    };
    const result = buildPollResult(body);
    expect(result.status).toBe('failed');
    expect(result.success).toBe(false);
    expect(result.failed).toBe(true);
  });

  it('handles empty body gracefully', () => {
    const result = buildPollResult(null);
    expect(result.status).toBe('');
    expect(result.trackingCode).toBe('');
    expect(result.referenceCode).toBe('');
    expect(result.invoiceNumber).toBe('');
    expect(result.message).toBe('');
    expect(result.success).toBe(false);
    expect(result.failed).toBe(false);
  });
});
