import { SepayError, SEPAY_ERROR_CODES } from './sepay.errors.js';
import { extractToken, type TokenEnvelope } from './sepay-response-utils.js';

export type SepayEnv = 'sandbox' | 'production';

export type SepayClientOptions = {
  env: SepayEnv;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  fetchImpl?: typeof fetch;
};

export type TokenResponse = TokenEnvelope;

const baseUrls: Record<SepayEnv, string> = {
  sandbox: 'https://einvoice-api-sandbox.sepay.vn',
  production: 'https://einvoice-api.sepay.vn'
};

export class SepayEInvoiceClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly fetchImpl: typeof fetch;
  private accessToken?: string;

  constructor(options: SepayClientOptions) {
    this.baseUrl = baseUrls[options.env];
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.accessToken = options.accessToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getToken(): Promise<TokenResponse> {
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await this.fetchImpl(`${this.baseUrl}/v1/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}` }
    });
    const body = await parseJson(response);
    if (!response.ok) throw new SepayError('SePay token request failed', response.status, SEPAY_ERROR_CODES.TOKEN_ERROR, body);
    const token = extractToken(body);
    if (!token || !token.access_token) throw new SepayError('Invalid SePay token response', 502, SEPAY_ERROR_CODES.INVALID_TOKEN_RESPONSE, body);
    this.accessToken = token.access_token;
    return token;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  async listProviderAccounts(): Promise<unknown> {
    return this.authenticatedGet('/v1/provider-accounts');
  }

  async getProviderAccount(accountId: string): Promise<unknown> {
    return this.authenticatedGet(`/v1/provider-accounts/${accountId}`);
  }

  async checkUsage(): Promise<unknown> {
    return this.authenticatedGet('/v1/usage');
  }

  async getInvoice(referenceCode: string): Promise<unknown> {
    return this.authenticatedGet(`/v1/invoices/${encodeURIComponent(referenceCode)}`);
  }

  async createInvoice(invoiceData: unknown): Promise<unknown> {
    return this.authenticatedJson('/v1/invoices/create', 'POST', invoiceData);
  }

  async checkCreateStatus(trackingCode: string): Promise<unknown> {
    return this.authenticatedGet(`/v1/invoices/create/check/${trackingCode}`);
  }

  async issueInvoice(referenceCode: string): Promise<unknown> {
    return this.authenticatedJson('/v1/invoices/issue', 'POST', { reference_code: referenceCode });
  }

  async checkIssueStatus(trackingCode: string): Promise<unknown> {
    return this.authenticatedGet(`/v1/invoices/issue/check/${trackingCode}`);
  }

  async downloadInvoice(referenceCode: string, type: 'pdf' | 'xml'): Promise<unknown> {
    return this.authenticatedGet(`/v1/invoices/${referenceCode}/download?type=${type}`);
  }

  async downloadInvoiceRaw(referenceCode: string, type: 'pdf' | 'xml'): Promise<Response> {
    if (!this.accessToken) await this.getToken();
    return this.fetchImpl(`${this.baseUrl}/v1/invoices/${referenceCode}/download?type=${type}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
  }

  private async authenticatedGet(path: string): Promise<unknown> {
    return this.authenticatedJson(path, 'GET');
  }

  private async authenticatedJson(path: string, method: 'GET' | 'POST', body?: unknown): Promise<unknown> {
    if (!this.accessToken) await this.getToken();
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const responseBody = await parseJson(response);
    if (!response.ok) throw new SepayError('SePay API request failed', response.status, SEPAY_ERROR_CODES.API_ERROR, responseBody);
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
