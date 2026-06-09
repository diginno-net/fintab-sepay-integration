import { describe, expect, it } from 'vitest';
import { allowedTaxRates, assertValidTaxRate } from './tax-profile.service.js';

describe('tax profile helpers', () => {
  it('allows supported tax rates', () => {
    expect(allowedTaxRates).toEqual([-2, -1, 0, 5, 8, 10]);
    expect(() => assertValidTaxRate(10)).not.toThrow();
  });

  it('rejects unsupported tax rates', () => {
    expect(() => assertValidTaxRate(7)).toThrow('Invalid tax rate');
  });
});
