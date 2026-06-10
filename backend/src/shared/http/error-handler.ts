import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, toErrorEnvelope } from './errors.js';

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply): void {
  const requestId = reply.getHeader('x-request-id')?.toString() ?? request.id;

  if (error instanceof AppError) {
    void reply.status(error.statusCode).send(toErrorEnvelope(error, requestId));
    return;
  }

  if (error instanceof ZodError) {
    const appError = new AppError('VALIDATION_ERROR', 'Validation failed', 400, error.flatten());
    void reply.status(400).send(toErrorEnvelope(appError, requestId));
    return;
  }

  if ('code' in error && (error as unknown as Record<string, unknown>).code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
    const appError = new AppError('VALIDATION_ERROR', 'Request body cannot be empty', 400);
    void reply.status(400).send(toErrorEnvelope(appError, requestId));
    return;
  }

  request.log.error({ err: error }, 'Unhandled request error');
  const appError = new AppError('INTERNAL_ERROR', 'Internal server error', 500);
  void reply.status(500).send(toErrorEnvelope(appError, requestId));
}
