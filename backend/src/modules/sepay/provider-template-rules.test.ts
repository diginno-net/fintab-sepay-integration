import { describe, expect, it, vi } from 'vitest';
import { SepayEInvoiceClient } from './sepay-einvoice-client.js';
import { assertProviderTemplateSeriesAvailable } from './provider-template-rules.js';

describe('assertProviderTemplateSeriesAvailable', () => {
  function mockClient(accountResponse: unknown) {
    return {
      getProviderAccount: vi.fn().mockResolvedValue(accountResponse),
    } as unknown as SepayEInvoiceClient;
  }

  it('returns early when provider_account_id is missing', async () => {
    const client = mockClient({});
    await expect(
      assertProviderTemplateSeriesAvailable(client, { template_code: 'T1', invoice_series: 'S1' })
    ).resolves.not.toThrow();
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: '', template_code: 'T1', invoice_series: 'S1' })
    ).resolves.not.toThrow();
  });

  it('returns early when template_code is missing', async () => {
    const client = mockClient({});
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', invoice_series: 'S1' })
    ).resolves.not.toThrow();
  });

  it('returns early when invoice_series is missing', async () => {
    const client = mockClient({});
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', template_code: 'T1' })
    ).resolves.not.toThrow();
  });

  it('returns early when templates array is empty', async () => {
    const client = mockClient({ data: { templates: [] } });
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', template_code: 'T1', invoice_series: 'S1' })
    ).resolves.not.toThrow();
  });

  it('returns early when account has no data.templates', async () => {
    const client = mockClient({ data: {} });
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', template_code: 'T1', invoice_series: 'S1' })
    ).resolves.not.toThrow();
  });

  it('returns early when templates is undefined', async () => {
    const client = mockClient({});
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', template_code: 'T1', invoice_series: 'S1' })
    ).resolves.not.toThrow();
  });

  it('does not throw when template/series matches available', async () => {
    const client = mockClient({
      data: {
        templates: [
          { template_code: 'T1', invoice_series: 'S1' },
          { template_code: 'T2', invoice_series: 'S2' },
        ],
      },
    });
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', template_code: 'T1', invoice_series: 'S1' })
    ).resolves.not.toThrow();
  });

  it('does not throw when template/series matches with camelCase keys', async () => {
    const client = mockClient({
      data: {
        templates: [
          { templateCode: 'T1', invoiceSeries: 'S1' },
        ],
      },
    });
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', template_code: 'T1', invoice_series: 'S1' })
    ).resolves.not.toThrow();
  });

  it('throws with available examples when template/series does not match', async () => {
    const client = mockClient({
      data: {
        templates: [
          { template_code: 'T1', invoice_series: 'S1' },
          { template_code: 'T2', invoice_series: 'S2' },
        ],
      },
    });
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', template_code: 'T99', invoice_series: 'S99' })
    ).rejects.toThrow('Mau T99 / ky hieu S99 khong thuoc tai khoan phat hanh hien tai');
  });

  it('includes available examples in error message', async () => {
    const client = mockClient({
      data: {
        templates: [
          { template_code: 'T1', invoice_series: 'S1' },
          { template_code: 'T2', invoice_series: 'S2' },
        ],
      },
    });
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', template_code: 'BAD', invoice_series: 'BAD' })
    ).rejects.toThrow('T1 / S1');
  });

  it('limits error message to 6 available examples', async () => {
    const templates = Array.from({ length: 10 }, (_, i) => ({
      template_code: `T${i}`,
      invoice_series: `S${i}`,
    }));
    const client = mockClient({ data: { templates } });
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', template_code: 'BAD', invoice_series: 'BAD' })
    ).rejects.toThrow('; ');
  });

  it('handles account without data envelope', async () => {
    const client = mockClient({
      templates: [{ template_code: 'T1', invoice_series: 'S1' }],
    });
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: 'acc1', template_code: 'T1', invoice_series: 'S1' })
    ).resolves.not.toThrow();
  });

  it('trims whitespace from inputs', async () => {
    const client = mockClient({
      data: {
        templates: [{ template_code: 'T1', invoice_series: 'S1' }],
      },
    });
    await expect(
      assertProviderTemplateSeriesAvailable(client, { provider_account_id: '  acc1  ', template_code: '  T1  ', invoice_series: '  S1  ' })
    ).resolves.not.toThrow();
  });
});
