import { describe, expect, it } from 'vitest';
import { decideJobRetry } from './job-retry-policy.js';

describe('job retry policy', () => {
  it('schedules retry while attempts remain', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const decision = decideJobRetry({ attempts: 1, maxAttempts: 3, now });

    expect(decision.shouldRetry).toBe(true);
    expect(decision.terminalStatus).toBeNull();
    expect(decision.nextRunAt?.getTime()).toBeGreaterThan(now.getTime());
  });

  it('marks terminal failure when max attempts reached', () => {
    const decision = decideJobRetry({ attempts: 3, maxAttempts: 3, now: new Date('2026-01-01T00:00:00.000Z') });

    expect(decision.shouldRetry).toBe(false);
    expect(decision.terminalStatus).toBe('failed');
    expect(decision.nextRunAt).toBeNull();
  });
});
