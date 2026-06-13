import type { InvoiceJob } from './invoice-job.service.js';

export type InvoiceOrderStatus =
  | 'not_created'
  | 'draft_queued'
  | 'draft_created'
  | 'issue_queued'
  | 'issued'
  | 'failed'
  | 'requires_draft_recreate'
  | 'cancelled'
  | 'processing';

export type InvoiceOrderActions = {
  canEditInvoiceInfo: boolean;
  canCreateDraft: boolean;
  canRecreateDraft: boolean;
  canIssue: boolean;
  canRetry: boolean;
  canRefresh: boolean;
  canDownloadPdf: boolean;
  canDownloadXml: boolean;
};

export function computeInvoiceOrderStatus(job: InvoiceJob | null | undefined, requiresDraftRecreate: boolean): InvoiceOrderStatus {
  if (!job) return 'not_created';
  if (requiresDraftRecreate && job.status === 'draft_created') return 'requires_draft_recreate';
  if (job.status === 'issued') return 'issued';
  if (job.status === 'draft_created') return 'draft_created';
  if (['failed', 'timeout'].includes(job.status)) return 'failed';
  if (job.status === 'cancelled') return 'cancelled';
  if (job.status.startsWith('draft_create')) return 'draft_queued';
  if (job.status.startsWith('issue')) return 'issue_queued';
  return 'processing';
}

export function computeInvoiceOrderActions(status: InvoiceOrderStatus, job: InvoiceJob | null | undefined): InvoiceOrderActions {
  const hasIssuedArtifact = status === 'issued' && Boolean(job?.download_available);
  return {
    canEditInvoiceInfo: !['issued', 'issue_queued'].includes(status),
    canCreateDraft: ['not_created', 'failed', 'cancelled'].includes(status),
    canRecreateDraft: status === 'requires_draft_recreate',
    canIssue: status === 'draft_created',
    canRetry: status === 'failed',
    canRefresh: ['draft_queued', 'issue_queued', 'processing'].includes(status),
    canDownloadPdf: hasIssuedArtifact,
    canDownloadXml: hasIssuedArtifact
  };
}

export function invoiceOrderStatusLabel(status: InvoiceOrderStatus): string {
  const labels: Record<InvoiceOrderStatus, string> = {
    not_created: 'Chưa tạo',
    draft_queued: 'Đang tạo nháp',
    draft_created: 'Đã tạo nháp',
    issue_queued: 'Đang phát hành',
    issued: 'Đã phát hành',
    failed: 'Lỗi',
    requires_draft_recreate: 'Cần tạo lại nháp',
    cancelled: 'Đã hủy',
    processing: 'Đang xử lý'
  };
  return labels[status];
}
