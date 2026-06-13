import { SepayEInvoiceClient } from './sepay-einvoice-client.js';
import { SepayError, SEPAY_ERROR_CODES } from './sepay.errors.js';

export type DownloadArtifact = {
  type: 'url' | 'base64' | 'binary';
  url?: string;
  data?: string;
  contentType?: string;
  filename?: string;
};

export async function downloadInvoiceNormalized(
  client: SepayEInvoiceClient,
  referenceCode: string,
  type: 'pdf' | 'xml'
): Promise<DownloadArtifact> {
  const response = await client.downloadInvoiceRaw(referenceCode, type);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new SepayError(
      'SePay download failed',
      response.status,
      response.status === 404 ? SEPAY_ERROR_CODES.DOWNLOAD_NOT_READY : SEPAY_ERROR_CODES.API_ERROR,
      parseDetails(text)
    );
  }

  const contentDisposition = response.headers.get('content-disposition') ?? '';
  const filename = extractFilename(contentDisposition, type);
  const contentType = response.headers.get('content-type') ?? (type === 'pdf' ? 'application/pdf' : 'application/xml');

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const text = buffer.toString('utf8');

  if (looksLikeJson(text)) {
    const json = JSON.parse(text);
    const url = extractUrlFromJson(json, type);
    if (url) return { type: 'url', url, contentType, filename };
    const data = extractDataFromJson(json, type);
    if (data) return { type: 'base64', data, contentType: type === 'pdf' ? 'application/pdf' : 'application/xml', filename };
    throw new SepayError('SePay did not return a downloadable invoice file', 400, SEPAY_ERROR_CODES.DOWNLOAD_NOT_READY, json);
  }

  if (looksLikeUrl(text)) {
    return { type: 'url', url: text.trim(), contentType, filename };
  }

  const base64 = buffer.toString('base64');
  return { type: 'base64', data: base64, contentType, filename };
}

function looksLikeUrl(text: string): boolean {
  const t = text.trim();
  return t.startsWith('http://') || t.startsWith('https://');
}

function looksLikeJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith('{') || t.startsWith('[');
}

function extractFilename(contentDisposition: string, type: 'pdf' | 'xml'): string {
  const match = contentDisposition.match(/filename[^;=\n]*=(?:(\\?['"])(.*?)\1|([^;\n]*))/i);
  if (match) return match[2] ?? match[3] ?? `invoice.${type}`;
  return `invoice.${type}`;
}

function extractUrlFromJson(json: unknown, type: 'pdf' | 'xml'): string | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as Record<string, unknown>;
  const candidates = [
    type === 'pdf' ? 'pdf_url' : 'xml_url',
    type === 'pdf' ? 'pdfUrl' : 'xmlUrl',
    type === 'pdf' ? 'download_url' : 'download_url',
    'url',
    'data'
  ];
  for (const key of candidates) {
    const val = obj[key];
    if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
      return val;
    }
  }
  const d = obj.data;
  if (d && typeof d === 'object') {
    const dataObj = d as Record<string, unknown>;
    for (const key of candidates) {
      const val = dataObj[key];
      if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
        return val;
      }
    }
  }
  return null;
}

function extractDataFromJson(json: unknown, type: 'pdf' | 'xml'): string | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as Record<string, unknown>;
  const candidates = ['data', 'base64', 'content', 'bytes'];
  for (const key of candidates) {
    const val = obj[key];
    if (typeof val === 'string' && isValidBase64(val)) return val;
  }
  const d = obj.data;
  if (d && typeof d === 'object') {
    const dataObj = d as Record<string, unknown>;
    for (const key of candidates) {
      const val = dataObj[key];
      if (typeof val === 'string' && isValidBase64(val)) return val;
    }
  }
  return null;
}

function isValidBase64(str: string): boolean {
  if (str.length < 10) return false;
  if (/^[A-Za-z0-9+/=]+$/.test(str)) return true;
  return false;
}

function parseDetails(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text.slice(0, 500) };
  }
}
