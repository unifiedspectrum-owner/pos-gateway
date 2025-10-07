/* Libraries imports */
import type { ErrorHandler, NotFoundHandler } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

/* Shared module imports */
import { getCurrentISOString } from "@shared/utils";

/* Global error handler - catches all thrown errors and returns standardized JSON response */
export const errorHandler: ErrorHandler = (err, c) => {
  /* Extract request context */
  const requestId = c.req.header('X-Request-ID') || 'unknown';
  const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

  /* Log error details for debugging */
  console.error("[ERROR-HANDLER] 500: Unhandled error caught", {
    error: errorMessage,
    requestId: requestId,
    path: `${c.req.method} ${c.req.path}`,
    stack: err.stack,
    timestamp: getCurrentISOString()
  });

  /* Default error response */
  let statusCode: ContentfulStatusCode = 500;
  let messageCode = 'INTERNAL_SERVER_ERROR';

  /* Map error types to HTTP status codes and message codes */
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    statusCode = 400;
    messageCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError' || err.message.includes('Unauthorized')) {
    statusCode = 401;
    messageCode = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError' || err.message.includes('Forbidden')) {
    statusCode = 403;
    messageCode = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError' || err.message.includes('Not found')) {
    statusCode = 404;
    messageCode = 'NOT_FOUND';
  } else if (err.name === 'ConflictError' || err.message.includes('Conflict')) {
    statusCode = 409;
    messageCode = 'CONFLICT';
  } else if (err.message.includes('rate limit')) {
    statusCode = 429;
    messageCode = 'RATE_LIMIT_EXCEEDED';
  } else if (err.name === 'DatabaseError' || err.message.includes('database')) {
    statusCode = 500;
    messageCode = 'DATABASE_ERROR';
  } else if (err.name === 'ExternalServiceError') {
    statusCode = 502;
    messageCode = 'EXTERNAL_SERVICE_ERROR';
  }

  /* Return standardized error response */
  return c.json({
    success: false,
    message: messageCode,
    error: errorMessage,
    timestamp: getCurrentISOString()
  }, statusCode);
};

/* 404 handler - handles undefined routes */
export const notFoundHandler: NotFoundHandler = (c) => {
  /* Extract request context */
  const requestId = c.req.header('X-Request-ID') || 'unknown';

  /* Log 404 for debugging */
  console.log("[ERROR-HANDLER] 404: Route not found", {
    requestId: requestId,
    path: `${c.req.method} ${c.req.path}`,
    timestamp: getCurrentISOString()
  });

  /* Return standardized 404 response */
  return c.json({
    success: false,
    message: 'ROUTE_NOT_FOUND',
    error: `Route ${c.req.method} ${c.req.path} not found`,
    timestamp: getCurrentISOString()
  }, 404);
};
