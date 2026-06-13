import { describe, expect, it, vi, beforeEach } from 'vitest';
import { extractOrderItems, resolvePaymentMethod, mapPancakeOrderToInvoicePreview } from './invoice-mapper.js';
import { type SepayShopConfig } from '../sepay/sepay.service.js';

vi.mock('../tax/tax-resolution.service.js', () => ({
  resolveTaxForOrderItem: vi.fn().mockResolvedValue({
    taxRate: 10,
    shouldBlock: false,
    warnings: [],
    source: 'default',
    invoiceLineType: '1',
    invoiceUnit: 'uni',
    product: null,
  }),
}));

const minimalOrder = {
  id: 'order-1',
  order_number: 'ORD001',
  status: 'completed',
  total: 100000,
  items: [
    { item_name: 'Product A', quantity: 1, unit_price: 100000, item_code: 'A001' },
  ],
  buyer: {
    name: 'Nguyen Van B',
    phone: '0909123456',
    email: 'b@example.com',
    address: '123 Tran B',
  },
  cash: 100000,
};

function makeConfig(overrides: Partial<SepayShopConfig> = {}): SepayShopConfig {
  return {
    provider_account_id: 'acc-123',
    template_code: null,
    invoice_series: 'SERIES-A',
    default_payment_method: null,
    default_tax_rate: null,
    has_credentials: true,
    env: 'sandbox',
    automation: {
      dryRun: true,
      autoCreateInvoice: false,
      autoIssueInvoice: false,
      requireAccountantConfirmationBeforeAutoIssue: true
    },
    ...overrides,
  };
}

describe('invoice mapper helpers', () => {
  it('extracts known item arrays', () => {
    expect(extractOrderItems({ items: [{ name: 'A' }] })).toHaveLength(1);
    expect(extractOrderItems({ order_items: [{ name: 'A' }] })).toHaveLength(1);
  });

  it('maps payment method', () => {
    expect(resolvePaymentMethod({ cash: 100 })).toBe('TM');
    expect(resolvePaymentMethod({ transfer_money: 100 })).toBe('CK');
    expect(resolvePaymentMethod({ cash: 100, transfer_money: 100 })).toBe('TM/CK');
  });
});

describe('mapPancakeOrderToInvoicePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes provider_account_id in payload from config', async () => {
    const config = makeConfig({ provider_account_id: 'acc-999' });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: config,
    });
    expect(result.payload.provider_account_id).toBe('acc-999');
  });

  it('includes invoice_series in payload from config', async () => {
    const config = makeConfig({ invoice_series: 'MY-SERIES' });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: config,
    });
    expect(result.payload.invoice_series).toBe('MY-SERIES');
  });

  it('omits provider_account_id when not set in config', async () => {
    const config = makeConfig({ provider_account_id: null });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: config,
    });
    expect(result.payload.provider_account_id).toBe('');
  });

  it('template 1 (gtgt) includes tax_rate in items', async () => {
    const config = makeConfig({ template_code: '1' });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'gtgt',
      sepayConfig: config,
    });
    expect(result.payload.template_code).toBe('1');
    expect(result.payload.items[0]).toHaveProperty('tax_rate');
  });

  it('template 2 (ban_hang) omits tax_rate in items', async () => {
    const config = makeConfig({ template_code: '2' });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: config,
    });
    expect(result.payload.template_code).toBe('2');
    expect(result.payload.items[0]).not.toHaveProperty('tax_rate');
  });

  it('applies default_payment_method from config', async () => {
    const config = makeConfig({ default_payment_method: 'CK' });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: config,
    });
    expect(result.payload.payment_method).toBe('CK');
  });

  it('falls back to order payment when default_payment_method is AUTO', async () => {
    const config = makeConfig({ default_payment_method: 'AUTO' });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: config,
    });
    expect(result.payload.payment_method).toBe('TM');
  });

  it('falls back to order payment when default_payment_method is null', async () => {
    const config = makeConfig({ default_payment_method: null });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: config,
    });
    expect(result.payload.payment_method).toBe('TM');
  });

  it('adds SEPAY_MISSING_CREDENTIALS warning when has_credentials is false', async () => {
    const config = makeConfig({ has_credentials: false });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: config,
    });
    expect(result.warnings.some(w => w.code === 'SEPAY_MISSING_CREDENTIALS')).toBe(true);
  });

  it('adds SEPAY_MISSING_PROVIDER_ACCOUNT warning when provider_account_id is null', async () => {
    const config = makeConfig({ provider_account_id: null });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: config,
    });
    expect(result.warnings.some(w => w.code === 'SEPAY_MISSING_PROVIDER_ACCOUNT')).toBe(true);
  });

  it('adds SEPAY_MISSING_INVOICE_SERIES warning when invoice_series is null', async () => {
    const config = makeConfig({ invoice_series: null });
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: config,
    });
    expect(result.warnings.some(w => w.code === 'SEPAY_MISSING_INVOICE_SERIES')).toBe(true);
  });

  it('adds SEPAY_CONFIG_NOT_LOADED warning when sepayConfig is undefined', async () => {
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 's1',
      order: minimalOrder,
      invoiceType: 'ban_hang',
      sepayConfig: undefined,
    });
    expect(result.warnings.some(w => w.code === 'SEPAY_CONFIG_NOT_LOADED')).toBe(true);
  });

  it('maps reference code, currency, total amount, and item discount', async () => {
    const result = await mapPancakeOrderToInvoicePreview({
      tenantId: 't1',
      shopId: 'shop-123456789',
      order: {
        id: 'order-9',
        order_currency: 'USD',
        total_price_after_sub_discount: 90000,
        cash: 90000,
        items: [
          {
            item_code: 'SKU-1',
            item_name: 'Product with discount',
            quantity: 2,
            unit_price: 50000,
            total_discount: 10000
          }
        ]
      },
      invoiceType: 'ban_hang',
      sepayConfig: makeConfig(),
    });

    expect(result.payload.reference_code).toBe('PANCAKE-shop-123-order-9');
    expect(result.payload.currency).toBe('USD');
    expect(result.payload.total_amount).toBe(90000);
    expect(result.payload.items[0]).toMatchObject({
      item_code: 'SKU-1',
      item_name: 'Product with discount',
      before_discount_and_tax_amount: 100000,
      discount_amount: 10000
    });
  });
});
