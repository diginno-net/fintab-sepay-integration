import { describe, expect, it } from 'vitest';
import { hashClientId } from './sepay-token-cache.js';

describe('sepay token cache', () => {
  it('hashes client id deterministically', () => {
    expect(hashClientId('client')).toBe(hashClientId('client'));
    expect(hashClientId('client')).not.toBe('client');
  });
});
