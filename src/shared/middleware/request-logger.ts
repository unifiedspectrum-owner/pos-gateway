/* Libraries imports */
import { Context, Next } from 'hono';

/* Shared module imports */
import { getCurrentISOString } from '@shared/utils';

/* Request logging middleware - Logs detailed information about incoming requests */
export async function requestLogger(c: Context<{ Bindings: Env }>, next: Next) {
  /* Extract request details */
  const method = c.req.method;
  const url = c.req.url;
  const path = c.req.path;
  const query = c.req.query();

  /* Extract headers */
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });

  /* Extract client information */
  const ipAddress = c.req.header('CF-Connecting-IP') ||
                    c.req.header('cf-connecting-ip') ||
                    c.req.header('X-Forwarded-For') ||
                    c.req.header('x-forwarded-for') ||
                    'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';
  const origin = c.req.header('Origin') || 'unknown';
  const referer = c.req.header('Referer') || 'unknown';
  const requestId = c.req.header('X-Request-ID') || 'unknown';

  /* Extract body for POST/PUT/PATCH requests (if JSON) */
  let body: any = null;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentType = c.req.header('Content-Type') || '';
    if (contentType.includes('application/json')) {
      try {
        /* Clone request to read body without consuming it */
        const clonedRequest = c.req.raw.clone();
        body = await clonedRequest.json();

        /* Mask sensitive fields */
        if (body) {
          body = maskSensitiveData(body);
        }
      } catch (error) {
        body = '[Invalid JSON]';
      }
    } else if (contentType.includes('multipart/form-data')) {
      body = '[Multipart Form Data]';
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      body = '[URL Encoded Form Data]';
    }
  }

  /* Log incoming request details */
  console.log('[REQUEST-LOGGER] 200: Incoming request captured', {
    requestId,
    method,
    path,
    url,
    query: Object.keys(query).length > 0 ? query : undefined,
    headers: {
      'content-type': headers['content-type'],
      'authorization': headers['authorization'] ? '[PRESENT]' : '[ABSENT]',
      'x-csrf-token': headers['x-csrf-token'] ? '[PRESENT]' : '[ABSENT]',
      'origin': origin,
      'referer': referer,
      'user-agent': userAgent,
    },
    client: {
      ipAddress,
      userAgent,
    },
    body: body || undefined,
    timestamp: getCurrentISOString()
  });

  /* Continue to next middleware */
  await next();

  /* Log response status after request completes */
  console.log(`[REQUEST-LOGGER] ${c.res.status}: Response sent`, {
    requestId,
    method,
    path,
    statusCode: c.res.status,
    timestamp: getCurrentISOString()
  });
}

/* Mask sensitive data in request body */
function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  /* Sensitive field names to mask */
  const sensitiveFields = [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'api_key',
    'apiKey',
    'secret',
    'credit_card',
    'creditCard',
    'card_number',
    'cardNumber',
    'cvv',
    'ssn',
    'pin',
    'otp',
  ];

  const masked = Array.isArray(data) ? [...data] : { ...data };

  for (const key in masked) {
    const lowerKey = key.toLowerCase();

    /* Mask sensitive fields */
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      masked[key] = '[REDACTED]';
    }
    /* Recursively mask nested objects */
    else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}
