import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';

export const CORRELATION_ID_HEADER = 'x-request-id';

export function getCorrelationId(request: FastifyRequest): string {
  const header = request.headers[CORRELATION_ID_HEADER];
  if (Array.isArray(header)) return header[0] ?? randomUUID();
  return header ?? randomUUID();
}

export function setCorrelationId(reply: FastifyReply, correlationId: string): void {
  reply.header(CORRELATION_ID_HEADER, correlationId);
}
