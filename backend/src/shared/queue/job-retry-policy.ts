export type JobRetryDecision = {
  shouldRetry: boolean;
  nextRunAt: Date | null;
  terminalStatus: 'failed' | null;
  reason: string;
};

export function decideJobRetry(input: { attempts: number; maxAttempts: number; now?: Date }): JobRetryDecision {
  const now = input.now ?? new Date();
  const attempts = Math.max(0, input.attempts);
  const maxAttempts = Math.max(1, input.maxAttempts);

  if (attempts >= maxAttempts) {
    return { shouldRetry: false, nextRunAt: null, terminalStatus: 'failed', reason: 'max_attempts_reached' };
  }

  return {
    shouldRetry: true,
    nextRunAt: new Date(now.getTime() + retryDelayMs(attempts)),
    terminalStatus: null,
    reason: 'retry_scheduled'
  };
}

function retryDelayMs(attempts: number): number {
  const baseMs = 30_000;
  const maxMs = 15 * 60_000;
  return Math.min(maxMs, baseMs * 2 ** Math.max(0, attempts - 1));
}
