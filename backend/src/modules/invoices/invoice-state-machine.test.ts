import { describe, expect, it } from 'vitest';
import { assertCanIssue, assertCanRetry } from './invoice-state-machine.js';

describe('invoice state machine', () => {
  it('allows issue only from draft_created', () => {
    expect(() => assertCanIssue('draft_created')).not.toThrow();
    expect(() => assertCanIssue('pending')).toThrow('Invoice must be draft before issue');
  });

  it('allows retry only failed or timeout', () => {
    expect(() => assertCanRetry('failed')).not.toThrow();
    expect(() => assertCanRetry('timeout')).not.toThrow();
    expect(() => assertCanRetry('issued')).toThrow('Only failed or timeout invoice jobs can be retried');
  });
});
