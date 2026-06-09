import { describe, expect, it } from 'vitest';
import { defaultInvoiceUnit, normalizeProductType } from './product-catalog.service.js';

describe('product catalog helpers', () => {
  it('normalizes default invoice unit', () => {
    expect(defaultInvoiceUnit('ĐVT cơ bản')).toBe('cái');
    expect(defaultInvoiceUnit('chai')).toBe('chai');
  });

  it('normalizes product type', () => {
    expect(normalizeProductType('Dịch vụ')).toBe('service');
    expect(normalizeProductType('Combo')).toBe('combo');
    expect(normalizeProductType('Hàng hoá')).toBe('goods');
  });
});
