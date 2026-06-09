export type InvoiceErrorInfo = {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  actionType?: 'button' | 'link';
};

type InvoiceErrorCode =
  | 'SEPAY_MISSING_CREDENTIALS'
  | 'SEPAY_MISSING_PROVIDER_ACCOUNT'
  | 'SEPAY_MISSING_INVOICE_SERIES'
  | 'SEPAY_CONFIG_NOT_LOADED'
  | 'SEPAY_API_ERROR'
  | 'SEPAY_TOKEN_ERROR'
  | 'SEPAY_INVALID_TOKEN_RESPONSE'
  | 'SEPAY_AUTH_FAILED'
  | 'SEPAY_INVALID_TEMPLATE_SERIES'
  | 'SEPAY_TEMPLATE_VALIDATION_FAILED'
  | 'SEPAY_DRAFT_NOT_READY'
  | 'SEPAY_INVOICE_NOT_FOUND'
  | 'SEPAY_DOWNLOAD_NOT_READY'
  | 'SEPAY_CREATE_NO_TRACKING'
  | 'SEPAY_CREATE_POLL_FAILED'
  | 'SEPAY_ISSUE_NO_TRACKING'
  | 'SEPAY_ISSUE_POLL_FAILED'
  | 'SEPAY_REFRESH_CREATE_FAILED'
  | 'SEPAY_REFRESH_ISSUE_FAILED'
  | string;

export type InvoiceErrorContext = {
  code: InvoiceErrorCode;
  message?: string;
  statusCode?: number;
};

const CONFIG_ERRORS: InvoiceErrorCode[] = [
  'SEPAY_MISSING_CREDENTIALS',
  'SEPAY_MISSING_PROVIDER_ACCOUNT',
  'SEPAY_MISSING_INVOICE_SERIES',
  'SEPAY_CONFIG_NOT_LOADED',
];

const AUTH_ERRORS: InvoiceErrorCode[] = [
  'SEPAY_TOKEN_ERROR',
  'SEPAY_INVALID_TOKEN_RESPONSE',
  'SEPAY_AUTH_FAILED',
];

const TEMPLATE_ERRORS: InvoiceErrorCode[] = [
  'SEPAY_INVALID_TEMPLATE_SERIES',
  'SEPAY_TEMPLATE_VALIDATION_FAILED',
];

const NOT_READY_ERRORS: InvoiceErrorCode[] = [
  'SEPAY_DRAFT_NOT_READY',
  'SEPAY_INVOICE_NOT_FOUND',
  'SEPAY_DOWNLOAD_NOT_READY',
];

const POLL_ERRORS: InvoiceErrorCode[] = [
  'SEPAY_CREATE_NO_TRACKING',
  'SEPAY_CREATE_POLL_FAILED',
  'SEPAY_ISSUE_NO_TRACKING',
  'SEPAY_ISSUE_POLL_FAILED',
  'SEPAY_REFRESH_CREATE_FAILED',
  'SEPAY_REFRESH_ISSUE_FAILED',
];

export function getInvoiceErrorInfo(ctx: InvoiceErrorContext): InvoiceErrorInfo {
  const { code } = ctx;

  if (CONFIG_ERRORS.includes(code)) {
    return {
      title: 'Thiếu cấu hình SePay',
      message: ctx.message ?? 'Vui lòng cấu hình SePay trong phần shop settings trước khi phát hành hóa đơn.',
      actionLabel: 'Cấu hình SePay',
      actionHref: '/settings/sepay',
      actionType: 'link',
    };
  }

  if (AUTH_ERRORS.includes(code)) {
    return {
      title: 'Xác thực SePay thất bại',
      message: ctx.message ?? 'Kiểm tra lại Client ID và Client Secret trong cấu hình SePay.',
      actionLabel: 'Cấu hình lại SePay',
      actionHref: '/settings/sepay',
      actionType: 'link',
    };
  }

  if (TEMPLATE_ERRORS.includes(code)) {
    return {
      title: 'Mẫu hóa đơn không hợp lệ',
      message: ctx.message ?? 'Template hoặc series được chọn không hợp lệ với tài khoản SePay. Vui lòng chọn lại template.',
      actionLabel: 'Chọn lại template',
      actionHref: '/settings/sepay',
      actionType: 'link',
    };
  }

  if (NOT_READY_ERRORS.includes(code)) {
    return {
      title: 'Hóa đơn chưa sẵn sàng',
      message: ctx.message ?? 'Hóa đơn chưa được phát hành hoặc đang chờ xử lý. Vui lòng thử làm mới.',
      actionLabel: 'Làm mới',
    };
  }

  if (POLL_ERRORS.includes(code)) {
    return {
      title: 'Không lấy được thông tin hóa đơn',
      message: ctx.message ?? 'Không nhận được phản hồi từ SePay trong thời gian chờ. Vui lòng thử lại.',
      actionLabel: 'Thử lại',
    };
  }

  if (code === 'SEPAY_API_ERROR') {
    return {
      title: 'Lỗi kết nối SePay',
      message: ctx.message ?? 'SePay không phản hồi. Vui lòng thử lại sau.',
      actionLabel: 'Thử lại',
    };
  }

  return {
    title: 'Đã xảy ra lỗi',
    message: ctx.message ?? 'Không thể hoàn thành thao tác. Vui lòng thử lại hoặc liên hệ admin.',
    actionLabel: 'Thử lại',
  };
}

export function isConfigError(code: string): boolean {
  return CONFIG_ERRORS.includes(code as InvoiceErrorCode);
}
