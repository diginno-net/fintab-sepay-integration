import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret, hasSecret, maskSecret } from './secret.service.js';

describe('secret service', () => {
  it('encrypts and decrypts secrets', () => {
    const encrypted = encryptSecret('secret-value');
    expect(encrypted).not.toBe('secret-value');
    expect(decryptSecret(encrypted)).toBe('secret-value');
  });

  it('masks secret values', () => {
    expect(maskSecret('abc')).toBe('••••••••');
    expect(hasSecret('abc')).toBe(true);
    expect(hasSecret('')).toBe(false);
  });
});
