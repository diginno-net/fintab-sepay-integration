import { describe, expect, it } from 'vitest';
import { hasShopAction } from './shop-access-policy.js';

describe('shop access policy', () => {
  it('allows viewer read actions only', () => {
    expect(hasShopAction('viewer', 'orders:read')).toBe(true);
    expect(hasShopAction('viewer', 'invoice:create')).toBe(false);
    expect(hasShopAction('viewer', 'integration:write')).toBe(false);
  });

  it('allows member invoice operations but not configuration', () => {
    expect(hasShopAction('member', 'invoice:create')).toBe(true);
    expect(hasShopAction('member', 'invoice:issue')).toBe(true);
    expect(hasShopAction('member', 'integration:write')).toBe(false);
  });

  it('allows admin configuration and retry actions', () => {
    expect(hasShopAction('admin', 'integration:write')).toBe(true);
    expect(hasShopAction('admin', 'jobs:retry')).toBe(true);
  });
});
