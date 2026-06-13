import { AppError } from '../http/errors.js';
import { SepayError, SEPAY_ERROR_CODES } from '../../modules/sepay/sepay.errors.js';

export type JobErrorClassification = 'transient' | 'permanent';

export function classifyJobError(error: unknown): JobErrorClassification {
  if (error instanceof AppError) {
    if (error.statusCode >= 500 || error.statusCode === 408 || error.statusCode === 429) return 'transient';
    return 'permanent';
  }

  if (error instanceof SepayError) {
    if (error.statusCode >= 500 || error.statusCode === 408 || error.statusCode === 429) return 'transient';
    if (TRANSIENT_SEPAY_CODES.has(error.code)) return 'transient';
    return 'permanent';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('timeout') || message.includes('timed out') || message.includes('econnreset') || message.includes('network')) {
      return 'transient';
    }
  }

  return 'transient';
}

const TRANSIENT_SEPAY_CODES = new Set<string>([
  SEPAY_ERROR_CODES.API_ERROR,
  SEPAY_ERROR_CODES.CREATE_POLL_FAILED,
  SEPAY_ERROR_CODES.ISSUE_POLL_FAILED,
  SEPAY_ERROR_CODES.REFRESH_CREATE_FAILED,
  SEPAY_ERROR_CODES.REFRESH_ISSUE_FAILED,
  SEPAY_ERROR_CODES.DOWNLOAD_NOT_READY
]);
