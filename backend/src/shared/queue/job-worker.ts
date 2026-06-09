import type { FastifyBaseLogger } from 'fastify';

export type WorkerLifecycle = {
  start(): Promise<void>;
  stop(): Promise<void>;
};

export function createWorkerLifecycle(logger: FastifyBaseLogger): WorkerLifecycle {
  return {
    async start() {
      logger.info('Job worker bootstrap ready');
    },
    async stop() {
      logger.info('Job worker stopped');
    }
  };
}
