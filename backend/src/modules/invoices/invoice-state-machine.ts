import { AppError } from '../../shared/http/errors.js';

export type InvoiceJobStatus =
  | 'pending'
  | 'draft_create_queued'
  | 'draft_create_running'
  | 'draft_create_polling'
  | 'draft_created'
  | 'issue_queued'
  | 'issue_running'
  | 'issue_polling'
  | 'issued'
  | 'failed'
  | 'timeout'
  | 'cancelled';

export function assertCanCreateDraft(status?: string | null): void {
  if (!status) return;
  if (status === 'issued') throw new AppError('VALIDATION_ERROR', 'Order already issued', 409, { code: 'INVOICE_ALREADY_ISSUED' });
  if (!['failed', 'timeout', 'cancelled'].includes(status)) {
    throw new AppError('VALIDATION_ERROR', 'Invoice job already exists for this order', 409, { code: 'INVOICE_JOB_EXISTS', status });
  }
}

export function assertCanIssue(status: string): void {
  if (status !== 'draft_created') {
    throw new AppError('VALIDATION_ERROR', 'Invoice must be draft before issue', 400, { code: 'INVOICE_NOT_DRAFT', status });
  }
}

export function assertCanRetry(status: string): void {
  if (!['failed', 'timeout'].includes(status)) {
    throw new AppError('VALIDATION_ERROR', 'Only failed or timeout invoice jobs can be retried', 400, { code: 'INVOICE_JOB_NOT_RETRYABLE', status });
  }
}
