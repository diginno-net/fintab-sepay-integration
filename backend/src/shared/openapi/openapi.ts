import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function registerOpenApi(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Fintab SePay Integration API',
        version: '0.1.0'
      },
      servers: [{ url: '/v1' }]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs'
  });
}
