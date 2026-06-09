import { SepayEInvoiceClient } from './sepay-einvoice-client.js';

export type ProviderTemplate = {
  template_code: string;
  invoice_series: string;
};

type ProviderAccountData = {
  templates?: Array<Record<string, unknown>>;
};

function cleanText(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

function extractData(account: unknown): ProviderAccountData {
  if (!account || typeof account !== 'object') return {};
  const a = account as Record<string, unknown>;
  if (typeof a.data === 'object' && a.data !== null) return a.data as ProviderAccountData;
  return a as ProviderAccountData;
}

function normalizeTemplates(templates: unknown): ProviderTemplate[] {
  if (!Array.isArray(templates)) return [];
  return templates.map((t) => ({
    template_code: cleanTemplateCode(t),
    invoice_series: cleanTemplateSeries(t)
  })).filter((t) => t.template_code || t.invoice_series);
}

function cleanTemplateCode(template: unknown): string {
  if (!template || typeof template !== 'object') return '';
  const t = template as Record<string, unknown>;
  return cleanText(t.template_code ?? t.templateCode ?? t.code);
}

function cleanTemplateSeries(template: unknown): string {
  if (!template || typeof template !== 'object') return '';
  const t = template as Record<string, unknown>;
  return cleanText(t.invoice_series ?? t.invoiceSeries ?? t.series ?? t.symbol);
}

export async function assertProviderTemplateSeriesAvailable(
  client: SepayEInvoiceClient,
  payload: { provider_account_id?: string; template_code?: string; invoice_series?: string }
): Promise<void> {
  const providerAccountId = cleanText(payload.provider_account_id);
  const templateCode = cleanText(payload.template_code);
  const invoiceSeries = cleanText(payload.invoice_series);
  if (!providerAccountId || !templateCode || !invoiceSeries) return;

  const account = await client.getProviderAccount(providerAccountId);
  const data = extractData(account);
  const templates = normalizeTemplates(data.templates);
  if (!templates.length) return;

  const matched = templates.some(
    (template) => template.template_code === templateCode && template.invoice_series === invoiceSeries
  );

  if (!matched) {
    const available = templates
      .map((template) => `${template.template_code || '-'} / ${template.invoice_series || '-'}`)
      .filter(Boolean)
      .slice(0, 6)
      .join('; ');
    throw new Error(
      `Mau ${templateCode} / ky hieu ${invoiceSeries} khong thuoc tai khoan phat hanh hien tai.${available ? ` Cac mau hien co: ${available}.` : ''} Vui long vao Cau hinh, tai mau tu SePay roi ap dung dung mau/ky hieu.`
    );
  }
}
