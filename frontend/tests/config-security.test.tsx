import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PancakeConfigForm } from '../features/pancake-config/pancake-config-form';
import { SepayConfigForm } from '../features/sepay-config/sepay-config-form';

vi.mock('../lib/api/client', () => ({
  apiFetch: vi.fn(),
  ApiClientError: class extends Error {
    constructor(
      public readonly status: number,
      public readonly code: string
    ) { super('mock error'); }
  }
}));

describe('PancakeConfigForm - no raw secrets', () => {
  it('does not display raw API key value', () => {
    const config = {
      id: 'shop-1',
      shop_id: 'shop_123',
      shop_name: 'Test Shop',
      status: 'active',
      config: {},
      has_api_key: true,
      has_webhook_secret: true,
      last_updated_at: new Date().toISOString()
    };
    render(<PancakeConfigForm shopId="shop-1" config={config as never} />);
    const inputs = screen.queryAllByDisplayValue(/pk_live|sk_live|whsec_/i);
    expect(inputs.length).toBe(0);
  });

  it('shows masked placeholder when secret exists', () => {
    const config = {
      id: 'shop-1',
      shop_id: 'shop_123',
      shop_name: 'Test Shop',
      status: 'active',
      config: {},
      has_api_key: true,
      has_webhook_secret: true,
      last_updated_at: new Date().toISOString()
    };
    render(<PancakeConfigForm shopId="shop-1" config={config as never} />);
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBeGreaterThan(0);
    passwordInputs.forEach(input => {
      const placeholder = input.getAttribute('placeholder');
      expect(placeholder).not.toMatch(/^[A-Za-z0-9+/=]{10,}$/);
    });
  });
});

describe('SepayConfigForm - no raw secrets', () => {
  it('does not display raw client secret value', () => {
    const config = {
      id: 'sepay-1',
      provider: 'sepay',
      scope: 'invoice',
      config: { env: 'sandbox' },
      has_client_id: true,
      has_client_secret: true,
      last_updated_at: new Date().toISOString()
    };
    render(<SepayConfigForm shopId="shop-1" config={config as never} />);
    const inputs = document.querySelectorAll('input[type="password"]');
    inputs.forEach(input => {
      const placeholder = input.getAttribute('placeholder');
      expect(placeholder).not.toMatch(/^[A-Za-z0-9+/=]{20,}$/);
    });
  });
});
