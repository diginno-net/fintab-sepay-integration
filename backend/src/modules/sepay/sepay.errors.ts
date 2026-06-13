export const SEPAY_ERROR_CODES = {
  API_ERROR: 'SEPAY_API_ERROR',
  TOKEN_ERROR: 'SEPAY_TOKEN_ERROR',
  INVALID_TOKEN_RESPONSE: 'SEPAY_INVALID_TOKEN_RESPONSE',
  AUTH_FAILED: 'SEPAY_AUTH_FAILED',
  CONFIG_REQUIRED: 'SEPAY_CONFIG_REQUIRED',
  INVALID_TEMPLATE_SERIES: 'SEPAY_INVALID_TEMPLATE_SERIES',
  DRAFT_NOT_READY: 'SEPAY_DRAFT_NOT_READY',
  INVOICE_NOT_FOUND: 'SEPAY_INVOICE_NOT_FOUND',
  DOWNLOAD_NOT_READY: 'SEPAY_DOWNLOAD_NOT_READY',
  TEMPLATE_VALIDATION_FAILED: 'SEPAY_TEMPLATE_VALIDATION_FAILED',
  CREATE_NO_TRACKING: 'SEPAY_CREATE_NO_TRACKING',
  CREATE_POLL_FAILED: 'SEPAY_CREATE_POLL_FAILED',
  ISSUE_NO_TRACKING: 'SEPAY_ISSUE_NO_TRACKING',
  ISSUE_POLL_FAILED: 'SEPAY_ISSUE_POLL_FAILED',
  REFRESH_CREATE_FAILED: 'SEPAY_REFRESH_CREATE_FAILED',
  REFRESH_ISSUE_FAILED: 'SEPAY_REFRESH_ISSUE_FAILED',
} as const;

export type SepayErrorCode = typeof SEPAY_ERROR_CODES[keyof typeof SEPAY_ERROR_CODES];

export class SepayError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: SepayErrorCode = SEPAY_ERROR_CODES.API_ERROR,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SepayError';
  }
}

export function humanizeSepayError(error: SepayError): string {
  const providerMessage = extractProviderMessage(error.details);

  if (error.code === SEPAY_ERROR_CODES.TOKEN_ERROR && error.statusCode === 401) {
    return 'Thông tin xác thực SePay không hợp lệ. Vui lòng kiểm tra Client ID, Client Secret và môi trường Sandbox/Production.';
  }

  if (error.code === SEPAY_ERROR_CODES.TOKEN_ERROR) {
    return providerMessage
      ? `Không lấy được token SePay: ${providerMessage}`
      : 'Không lấy được token SePay. Vui lòng kiểm tra cấu hình SePay.';
  }

  if (error.code === SEPAY_ERROR_CODES.DOWNLOAD_NOT_READY) {
    return providerMessage
      ? `SePay chưa trả file hóa đơn: ${providerMessage}`
      : 'PDF/XML chưa sẵn sàng từ SePay. Vui lòng bấm Làm mới rồi thử lại.';
  }

  return providerMessage ? `${error.message}: ${providerMessage}` : error.message;
}

function extractProviderMessage(details: unknown): string | null {
  if (!details || typeof details !== 'object') return null;
  const root = details as Record<string, unknown>;
  const direct = root.message;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const error = root.error;
  if (error && typeof error === 'object') {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim()) return message.trim();
  }
  return null;
}
