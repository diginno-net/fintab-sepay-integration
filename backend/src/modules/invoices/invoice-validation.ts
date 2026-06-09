import { AppError } from '../../shared/http/errors.js';
import type { InvoicePreview } from './invoice-mapper.js';

export function validateInvoicePreview(preview: InvoicePreview): void {
  if (!preview.payload.buyer.name) {
    throw new AppError('VALIDATION_ERROR', 'Buyer name is required', 400);
  }
  if (preview.payload.items.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Invoice must contain at least one item', 400);
  }
  const blockingWarning = preview.warnings.find(warning => warning.code === 'TAX_MAPPING_BLOCKED');
  if (blockingWarning) {
    throw new AppError('VALIDATION_ERROR', blockingWarning.message, 400, { warning: blockingWarning });
  }
}
