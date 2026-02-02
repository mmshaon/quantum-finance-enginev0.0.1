import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandlerPlugin: FastifyPluginAsync = async (server) => {
  server.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    const code = (error as any).code || 'INTERNAL_ERROR';

    // Log error
    if (statusCode >= 500) {
      server.log.error({
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
      });
    }

    // Send error response
    reply.status(statusCode).send({
      success: false,
      error: {
        code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          details: (error as any).details 
        }),
      },
    });
  });
};

export default fp(errorHandlerPlugin);
export { errorHandlerPlugin };
