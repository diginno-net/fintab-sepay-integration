import { describe, expect, it } from 'vitest';
import { can, listPermissions } from './rbac.service.js';

describe('rbac service', () => {
  it('allows accountant to issue invoices', () => {
    expect(can('accountant', 'invoice:issue')).toBe(true);
  });

  it('does not allow viewer to issue invoices', () => {
    expect(can('viewer', 'invoice:issue')).toBe(false);
  });

  it('gives owner all permissions', () => {
    expect(listPermissions('owner')).toContain('audit:read');
    expect(listPermissions('owner')).toContain('integration:write');
  });
});
