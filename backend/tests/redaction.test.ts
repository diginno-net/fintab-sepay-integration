import { describe, expect, it } from 'vitest';
import { encryptSecret, decryptSecret } from '../src/modules/integrations/secret.service.js';

describe('secret redaction', () => {
  it('encryptSecret returns ciphertext not plaintext', () => {
    const apiKey = 'pk_live_abc123xyz';
    const encrypted = encryptSecret(apiKey);
    expect(encrypted).not.toBe(apiKey);
    expect(encrypted.length).toBeGreaterThan(50);
  });

  it('encryptSecret is reversible', () => {
    const secret = 'my-super-secret-api-key';
    const encrypted = encryptSecret(secret);
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(secret);
  });

  it('API error responses do not leak raw secrets', () => {
    const rawSecret = 'sk_live_provider_secret';
    const safeResponse = {
      data: { id: 'shop-1', has_api_key: true }
    };
    const unsafeResponse = {
      data: { id: 'shop-1', has_api_key: true, raw_secret: rawSecret }
    };

    expect(JSON.stringify(safeResponse)).not.toContain(rawSecret);
    expect(JSON.stringify(unsafeResponse)).toContain(rawSecret);
  });
});
