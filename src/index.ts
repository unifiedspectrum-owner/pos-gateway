/* Libraries imports */
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { logger } from "hono/logger";
import { timing } from "hono/timing";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { compress } from "hono/compress";

/* Shared module imports */
import { ALLOWED_ORIGINS, MAX_REQUEST_BODY_SIZE_MB } from "@shared/constants";
import { errorHandler, jwtAuthMiddleware, permissionAuthMiddleware, notFoundHandler, requestLogger, securityMiddleware } from "@shared/middleware";
import { csrfRoutes, posWorkerRoutes } from "@shared/routes";

/* Auth management module imports */
import { authRoutes } from "@auth-management/routes";
import { extractRequestInfo } from "@auth-management/utils";

/* Initialize Hono application with Cloudflare Workers environment bindings */
const app = new Hono<{ Bindings: Env }>();

/* Security middleware stack - Applied in specific order for optimal protection */

/* 1. Request Tracing - Must be FIRST to track all requests */
app.use('*', requestId());  // Add unique X-Request-ID header for request tracing and debugging

/* 2. Logging - Early to capture all requests including rejections */
app.use('*', logger());     // Log requests with method, path, status code, and response time

/* 3. Detailed Request Logging - Log all incoming request details */
// app.use('*', requestLogger);  // Log detailed request information for debugging and monitoring

/* 4. Performance Timing - Early to measure everything */
app.use('*', timing());     // Add Server-Timing header to measure request performance

/* 5. Body Size Limit - BEFORE body parsing to prevent DoS attacks early */
app.use('*', bodyLimit({
  maxSize: MAX_REQUEST_BODY_SIZE_MB * 1024 * 1024,  // 10MB max request body size
  onError: (c) => {
    /* Add CORS headers to error response */
    const origin = c.req.header('origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Access-Control-Allow-Credentials', 'true');
    }

    return c.json({
      success: false,
      message: 'PAYLOAD_TOO_LARGE',
      error: `Request body too large. Maximum size is ${MAX_REQUEST_BODY_SIZE_MB}MB.`,
      timestamp: new Date().toISOString(),
    }, 413);
  }
}));

/* 6. Security Headers - Set early to apply to all responses */
app.use('*', secureHeaders({
  /* Content Security Policy - Controls what resources can be loaded */
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],                      // Default source: only same origin
    scriptSrc: ["'self'", "'unsafe-inline'"],    // Allow scripts from same origin and inline
    styleSrc: ["'self'", "'unsafe-inline'"],     // Allow styles from same origin and inline
    imgSrc: ["'self'", "data:", "https:"],       // Allow images from same origin, data URIs, and HTTPS
    connectSrc: ["'self'"],                      // API calls allowed only to same origin
    fontSrc: ["'self'"],                         // Fonts allowed only from same origin
    objectSrc: ["'none'"],                       // Block plugins (Flash, Java, etc.)
    mediaSrc: ["'self'"],                        // Media (audio/video) only from same origin
    frameSrc: ["'none'"],                        // Block embedding in iframes
  },
  /* HSTS - Force HTTPS for 1 year including subdomains */
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  /* Prevent MIME type sniffing attacks */
  xContentTypeOptions: 'nosniff',
  /* Prevent clickjacking by blocking iframe embedding */
  xFrameOptions: 'DENY',
  /* Enable XSS filter in older browsers */
  xXssProtection: '1; mode=block',
  /* Control referrer information sent to other sites */
  referrerPolicy: 'strict-origin-when-cross-origin',
  /* Control browser features and APIs */
  permissionsPolicy: {
    camera: ["'none'"],                          // Block camera access
    microphone: ["'none'"],                      // Block microphone access
    geolocation: ["'none'"],                     // Block geolocation access
  },
}));

/* 7. Rate Limiting - Block abusive requests BEFORE expensive operations */
app.use("*", async (c, next) => {
  const limiter = rateLimiter<{ Bindings: Env }>({
    windowMs: 15 * 60 * 1000,                          // Time window in milliseconds (15 minutes)
    limit: 100,                                        // Maximum requests allowed per IP in the time window
    standardHeaders: "draft-7",                        // Send RateLimit-* headers following IETF draft-7 spec
    keyGenerator: (c) => extractRequestInfo(c).ip_address,  // Extract client IP for rate limit tracking
    handler: (c) => {
      /* Add CORS headers to rate limit error response */
      const origin = c.req.header('origin');
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        c.header('Access-Control-Allow-Origin', origin);
        c.header('Access-Control-Allow-Credentials', 'true');
      }

      return c.json({
        success: false,
        message: 'RATE_LIMIT_EXCEEDED',
        error: 'Too many requests. Please try again later.',
        timestamp: new Date().toISOString(),
      }, 429);
    }
  });
  return limiter(c, next);
});

/* 8. Security Middleware - Validate requests for SQL injection, XSS, path traversal, and malicious headers */
// app.use('*', securityMiddleware);

/* 9. CORS - Must be BEFORE CSRF for preflight OPTIONS requests to work */
app.use("*", cors({
  origin: ALLOWED_ORIGINS,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],  // Allow CSRF token header
  maxAge: 86400,  // 24 Hours
  credentials: true,
}));

/* 10. CSRF Protection - After CORS, before routes */
app.use('*', csrf({
  origin: ALLOWED_ORIGINS,  // Only accept CSRF tokens from allowed origins
}));

/* 11. Response Compression - LAST to compress final response */
// app.use('*', compress());   // Enable gzip/deflate compression for response bodies

/* Routes */

/* Health check endpoint - Public, no authentication required */
app.get("/health", (c) => {
  console.log('[API-GATEWAY] 200: Health check endpoint accessed');
  return c.json({
    success: true,
    message: "API_GATEWAY_HEALTHY",
    data: {
      status: "running",
      service: "POS API Gateway",
    },
    timestamp: new Date().toISOString()
  });
});

/* API routes with versioning */
const apiRoute = app.basePath('api');
const v1Route = apiRoute.basePath('v1');

/* CSRF Token Routes - Public endpoint for obtaining CSRF tokens */
const csrfRoute = v1Route.basePath('csrf');
csrfRoute.route('/', csrfRoutes);

/* CSRF Token Routes - Public endpoint for obtaining CSRF tokens */
const publicRoutes = v1Route.basePath('public');
publicRoutes.route('*', posWorkerRoutes);

/* Authentication Routes - JWT middleware applied per route inside authRoutes */
const authenticationRoutes = v1Route.basePath('auth');
authenticationRoutes.route('/', authRoutes);

/* POS Worker Routes - Forward all validated requests to pos-backend worker */
/* Apply JWT authentication and permission validation to all POS worker routes */
v1Route.use('*', jwtAuthMiddleware);       // JWT authentication - validates token and session
v1Route.use('*', permissionAuthMiddleware); // Permission authorization - validates user access rights
v1Route.route('/', posWorkerRoutes);

/* Error handlers - Must be AFTER routes */
app.onError(errorHandler);      // Global error handler for all thrown errors
app.notFound(notFoundHandler);  // 404 handler for undefined routes

export default {
  fetch: app.fetch,
  // queue: async (batch: MessageBatch<any>, env: Env, ctx: ExecutionContext) => {
  //   const queueName = batch.queue;

  //   try {
  //     switch (queueName) {
  //       case 'pos-notify':
  //         return await CommunicationQueueHandler.queue(batch, env, ctx);
  //       default:
  //         console.error('Unknown queue name:', { queueName, timestamp: new Date().toISOString() });
  //         throw new Error(`Unsupported queue: ${queueName}`);
  //     }
  //   } catch (error) {
  //     console.error('Queue processing error:', {
  //       queueName,
  //       error: error instanceof Error ? error.message : 'Unknown error',
  //       timestamp: new Date().toISOString()
  //     });
  //     throw error;
  //   }
  // }
};
