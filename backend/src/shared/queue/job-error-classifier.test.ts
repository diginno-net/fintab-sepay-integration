import { describe, expect, it } from 'vitest';
import { AppError } from '../http/errors.js';
import { SepayError, SEPAY_ERROR_CODES } from '../../modules/sepay/sepay.errors.js';
import { classifyJobError } from './job-error-classifier.js';

describe('classifyJobError', () => {
  it('classifies validation errors as permanent', () => {
    expect(classifyJobError(new AppError('VALIDATION_ERROR', 'Missing config', 400))).toBe('permanent');
  });

  it('classifies server errors as transient', () => {
    expect(classifyJobError(new AppError('INTERNAL_ERROR', 'Temporary failure', 500))).toBe('transient');
  });

  it('classifies SePay auth failures as permanent', () => {
    expect(classifyJobError(new SepayError('Unauthorized', 401, SEPAY_ERROR_CODES.TOKEN_ERROR))).toBe('permanent');
  });

  it('classifies SePay 5xx failures as transient', () => {
    expect(classifyJobError(new SepayError('Unavailable', 503, SEPAY_ERROR_CODES.API_ERROR))).toBe('transient');
  });
});
