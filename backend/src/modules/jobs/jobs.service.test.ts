import { describe, expect, it } from 'vitest';
import { enqueueJob } from '../../shared/queue/job-queue.js';

describe('job queue input validation shape', () => {
  it('exports enqueueJob function', () => {
    expect(typeof enqueueJob).toBe('function');
  });
});
