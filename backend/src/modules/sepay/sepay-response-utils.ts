export type TokenEnvelope = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

export function extractToken(body: unknown): TokenEnvelope | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  if (typeof b.access_token === 'string' && b.access_token.length > 0) {
    return {
      access_token: b.access_token,
      token_type: typeof b.token_type === 'string' ? b.token_type : undefined,
      expires_in: typeof b.expires_in === 'number' ? b.expires_in : undefined
    };
  }

  if (typeof b.data === 'object' && b.data !== null) {
    const d = b.data as Record<string, unknown>;
    if (typeof d.access_token === 'string' && d.access_token.length > 0) {
      return {
        access_token: d.access_token,
        token_type: typeof d.token_type === 'string' ? d.token_type : undefined,
        expires_in: typeof d.expires_in === 'number' ? d.expires_in : undefined
      };
    }
  }

  return null;
}

export type TrackingCodeResult = {
  trackingCode: string;
  message?: string;
  status?: string;
};

export function extractTrackingCode(body: unknown): TrackingCodeResult | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  const data = b.data as Record<string, unknown> | undefined;

  const trackingCode =
    (typeof b.tracking_code === 'string' ? b.tracking_code : undefined) ||
    (typeof data?.tracking_code === 'string' ? data.tracking_code : undefined) ||
    (typeof b.trackingCode === 'string' ? b.trackingCode : undefined) ||
    '';

  if (!trackingCode) return null;

  return {
    trackingCode,
    message: extractMessage(body),
    status: extractStatus(body)
  };
}

export function extractReferenceCode(...responses: unknown[]): string {
  for (const body of responses) {
    if (!body || typeof body !== 'object') continue;
    const b = body as Record<string, unknown>;
    const data = b.data as Record<string, unknown> | undefined;
    const invoice = data?.invoice as Record<string, unknown> | undefined;

    const referenceCode =
      (typeof b.reference_code === 'string' ? b.reference_code : undefined) ||
      (typeof data?.reference_code === 'string' ? data.reference_code : undefined) ||
      (typeof invoice?.reference_code === 'string' ? invoice.reference_code : undefined) ||
      '';

    if (referenceCode) return referenceCode;
  }
  return '';
}

export function extractInvoiceNumber(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const b = body as Record<string, unknown>;
  const data = b.data as Record<string, unknown> | undefined;
  const invoice = data?.invoice as Record<string, unknown> | undefined;

  return (
    (typeof b.invoice_number === 'string' ? b.invoice_number : undefined) ||
    (typeof data?.invoice_number === 'string' ? data.invoice_number : undefined) ||
    (typeof invoice?.invoice_number === 'string' ? invoice.invoice_number : undefined) ||
    ''
  );
}

export function extractStatus(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const b = body as Record<string, unknown>;
  const data = b.data as Record<string, unknown> | undefined;

  return (
    (typeof b.status === 'string' ? b.status : undefined) ||
    (typeof data?.status === 'string' ? data.status : undefined) ||
    (typeof data?.state === 'string' ? data.state : undefined) ||
    ''
  );
}

export function normalizeStatus(value: string): string {
  return (value || '').trim().toLowerCase();
}

export function isSuccessStatus(status: string): boolean {
  const s = normalizeStatus(status);
  return ['success', 'succeeded', 'done', 'completed'].includes(s);
}

export function isFailedStatus(status: string): boolean {
  const s = normalizeStatus(status);
  return ['failed', 'fail', 'error', 'rejected'].includes(s);
}

export function extractMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const b = body as Record<string, unknown>;
  const data = b.data as Record<string, unknown> | undefined;

  if (typeof b.message === 'string') return b.message;
  if (typeof data?.message === 'string') return data.message;
  if (typeof b.error === 'object' && b.error !== null) {
    const errMsg = (b.error as Record<string, unknown>).message;
    if (typeof errMsg === 'string') return errMsg;
  }
  return '';
}

export function extractDownloadUrl(body: unknown, type: 'pdf' | 'xml'): string {
  if (!body || typeof body !== 'object') return '';
  const b = body as Record<string, unknown>;
  const data = b.data as Record<string, unknown> | undefined;

  const url =
    (type === 'pdf'
      ? (typeof b.pdf_url === 'string' ? b.pdf_url : undefined) ||
        (typeof data?.pdf_url === 'string' ? data.pdf_url : undefined) ||
        (typeof b.pdfUrl === 'string' ? b.pdfUrl : undefined) ||
        (typeof data?.pdfUrl === 'string' ? data.pdfUrl : undefined)
      : (typeof b.xml_url === 'string' ? b.xml_url : undefined) ||
        (typeof data?.xml_url === 'string' ? data.xml_url : undefined) ||
        (typeof b.xmlUrl === 'string' ? b.xmlUrl : undefined) ||
        (typeof data?.xmlUrl === 'string' ? data.xmlUrl : undefined)) ||
    '';

  return url;
}

export type PollResult = {
  body: unknown;
  status: string;
  trackingCode: string;
  referenceCode: string;
  invoiceNumber: string;
  message: string;
  success: boolean;
  failed: boolean;
};

export function buildPollResult(body: unknown): PollResult {
  const status = extractStatus(body);
  const trackingResult = extractTrackingCode(body);
  return {
    body,
    status,
    trackingCode: trackingResult?.trackingCode || '',
    referenceCode: extractReferenceCode(body),
    invoiceNumber: extractInvoiceNumber(body),
    message: trackingResult?.message || extractMessage(body),
    success: isSuccessStatus(status),
    failed: isFailedStatus(status)
  };
}
