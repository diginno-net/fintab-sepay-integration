export type Tone = 'neutral' | 'success' | 'warning' | 'danger';

export function backgroundJobTypeLabel(type: string): string {
  const normalized = type.replace(/^invoice:/, '');
  const map: Record<string, string> = {
    create_draft: 'Tạo nháp',
    'create-draft': 'Tạo nháp',
    issue: 'Phát hành',
    poll_create: 'Kiểm tra nháp',
    'poll-create': 'Kiểm tra nháp',
    poll_issue: 'Kiểm tra phát hành',
    'poll-issue': 'Kiểm tra phát hành',
    'pancake:orders-full-sync': 'Đồng bộ đơn Pancake'
  };
  return map[type] ?? map[normalized] ?? type;
}

export function backgroundJobStatus(status: string, deadLetteredAt?: string | null): { label: string; tone: Tone } {
  if (deadLetteredAt) return { label: 'Dừng retry', tone: 'danger' };
  const map: Record<string, { label: string; tone: Tone }> = {
    queued: { label: 'Chờ xử lý', tone: 'warning' },
    running: { label: 'Đang chạy', tone: 'warning' },
    succeeded: { label: 'Worker xong', tone: 'success' },
    failed: { label: 'Worker lỗi', tone: 'danger' },
    timeout: { label: 'Quá hạn', tone: 'danger' },
    cancelled: { label: 'Đã hủy', tone: 'neutral' }
  };
  return map[status] ?? { label: status, tone: 'neutral' };
}

export function invoiceStatus(status: string): { label: string; tone: Tone } {
  const map: Record<string, { label: string; tone: Tone }> = {
    draft_create_queued: { label: 'Chờ tạo nháp', tone: 'warning' },
    draft_create_running: { label: 'Đang tạo nháp', tone: 'warning' },
    draft_create_polling: { label: 'Đang kiểm tra nháp', tone: 'warning' },
    draft_created: { label: 'Nháp sẵn sàng', tone: 'success' },
    issue_queued: { label: 'Chờ phát hành', tone: 'warning' },
    issue_running: { label: 'Đang phát hành', tone: 'warning' },
    issue_polling: { label: 'Đang kiểm tra phát hành', tone: 'warning' },
    issued: { label: 'Đã phát hành', tone: 'success' },
    failed: { label: 'Lỗi nghiệp vụ', tone: 'danger' },
    timeout: { label: 'Quá hạn', tone: 'danger' },
    cancelled: { label: 'Đã hủy', tone: 'neutral' }
  };
  return map[status] ?? { label: status, tone: 'neutral' };
}

export function pancakeOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    new: 'Mới',
    shipped: 'Đã giao vận',
    delivered: 'Đã giao',
    returning: 'Đang hoàn',
    returned: 'Đã hoàn',
    submitted: 'Đã gửi',
    pending: 'Đang chờ'
  };
  return map[status] ?? status;
}
