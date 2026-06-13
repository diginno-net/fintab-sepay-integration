import { redactUrl } from '../../shared/observability/redaction.js';
import type { PancakeOrderListQuery } from './pancake-order-filter.js';

export type PancakeClientOptions = {
  baseUrl?: string;
  shopId: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
};

export type PancakeRequestOptions = {
  query?: Record<string, string | number | boolean | Array<string | number | boolean> | undefined>;
};

export class PancakeApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly redactedUrl: string,
    public readonly responseBody?: unknown
  ) {
    super(message);
    this.name = 'PancakeApiError';
  }
}

export class PancakeClient {
  private readonly baseUrl: string;
  private readonly shopId: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PancakeClientOptions) {
    this.baseUrl = options.baseUrl ?? 'https://pos.pages.fm/api/v1';
    this.shopId = options.shopId;
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async testConnection(): Promise<unknown> {
    return this.get(`/shops/${this.shopId}/orders`, { query: { page_size: 1 } });
  }

  async listOrders(query?: PancakeOrderListQuery): Promise<unknown> {
    return this.get(`/shops/${this.shopId}/orders`, { query });
  }

  async getOrder(orderId: string): Promise<unknown> {
    return this.get(`/shops/${this.shopId}/orders/${orderId}`);
  }

  async listProducts(query?: Record<string, string | number | boolean | Array<string | number | boolean> | undefined>): Promise<unknown> {
    return this.get(`/shops/${this.shopId}/products/variations`, { query });
  }

  async configureWebhook(input: { webhookUrl: string; webhookTypes: string[]; headers?: Record<string, string> }): Promise<unknown> {
    return this.request(`/shops/${this.shopId}`, 'PUT', {
      webhook_url: input.webhookUrl,
      webhook_types: input.webhookTypes,
      webhook_headers: input.headers ?? {}
    });
  }

  buildUrl(path: string, options: PancakeRequestOptions = {}): URL {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set('api_key', this.apiKey);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, String(item));
        continue;
      }
      url.searchParams.set(key, String(value));
    }
    return url;
  }

  redactUrl(url: URL): string {
    return redactUrl(url.toString());
  }

  private async get(path: string, options: PancakeRequestOptions = {}): Promise<unknown> {
    return this.request(path, 'GET', undefined, options);
  }

  private async request(path: string, method: 'GET' | 'PUT', requestBody?: unknown, options: PancakeRequestOptions = {}): Promise<unknown> {
    const url = this.buildUrl(path, options);
    const response = await this.fetchImpl(url, {
      method,
      ...(requestBody ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) } : {})
    });
    const responseBody = await parseJson(response);
    if (!response.ok) {
      throw new PancakeApiError('Pancake API request failed', response.status, this.redactUrl(url), responseBody);
    }
    return responseBody;
  }
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}
