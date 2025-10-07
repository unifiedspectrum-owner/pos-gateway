/* Libraries imports */
import { Context, Next } from 'hono';

/* Shared module imports */
import { getCurrentISOString } from '@shared/utils';

/* Additional security middleware for request validation and attack prevention */
export async function securityMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  /* Skip security checks for OPTIONS requests (CORS preflight) */
  if (c.req.method === 'OPTIONS') {
    return await next();
  }

  /* Content-Type validation for mutation requests */
  if (['POST', 'PUT'].includes(c.req.method)) {
    const contentType = c.req.header('Content-Type');
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return c.json({
        success: false,
        message: 'UNSUPPORTED_MEDIA_TYPE',
        error: 'Content-Type must be application/json or multipart/form-data',
        timestamp: getCurrentISOString()
      }, 415);
    }
  }

  /* Check for SQL injection patterns in query parameters */
  const queryString = c.req.url.split('?')[1];
  if (queryString && hasSQLInjectionPattern(queryString)) {
    logSecurityEvent(c, 'sql_injection_attempt', { queryString });
    return c.json({
      success: false,
      message: 'INVALID_REQUEST',
      error: 'Invalid request parameters detected',
      timestamp: getCurrentISOString()
    }, 400);
  }

  /* Check for XSS patterns in query parameters */
  if (queryString && hasXSSPattern(queryString)) {
    logSecurityEvent(c, 'xss_attempt', { queryString });
    return c.json({
      success: false,
      message: 'INVALID_REQUEST',
      error: 'Invalid request parameters detected',
      timestamp: getCurrentISOString()
    }, 400);
  }

  /* Check for path traversal attempts in URL path */
  const path = c.req.path;
  if (hasPathTraversalPattern(path)) {
    logSecurityEvent(c, 'path_traversal_attempt', { path });
    return c.json({
      success: false,
      message: 'INVALID_REQUEST',
      error: 'Invalid request path detected',
      timestamp: getCurrentISOString()
    }, 400);
  }

  /* Check for common attack patterns in headers */
  const suspiciousHeaders = checkSuspiciousHeaders(c.req.raw.headers);
  if (suspiciousHeaders.length > 0) {
    logSecurityEvent(c, 'suspicious_headers', { headers: suspiciousHeaders });
    return c.json({
      success: false,
      message: 'INVALID_REQUEST',
      error: 'Invalid request headers detected',
      timestamp: getCurrentISOString()
    }, 400);
  }

  /* Check for null byte injection in URL */
  if (c.req.url.includes('\x00')) {
    logSecurityEvent(c, 'null_byte_injection', { url: c.req.url });
    return c.json({
      success: false,
      message: 'INVALID_REQUEST',
      error: 'Invalid request URL detected',
      timestamp: getCurrentISOString()
    }, 400);
  }

  return await next();
}

/* Check input for SQL injection attack patterns */
function hasSQLInjectionPattern(input: string): boolean {
  try {
    const decoded = decodeURIComponent(input);
    const patterns = [
      /* SQL Keywords */
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|declare|grant|revoke|truncate|replace|merge|into|outfile|dumpfile|load_file|benchmark)\b)/i,

      /* SQL Comments and Delimiters */
      /('|(--)|#|;|\/\*|\*\/|xp_|sp_)/i,

      /* Boolean-based injection */
      /(\bor\b\s+\d+\s*=\s*\d+)|(\band\b\s+\d+\s*=\s*\d+)/i,
      /(\bor\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/i,
      /(=\s*['"].*?--)/i, // = followed by quote and SQL comment
      /(=\s*['"].*?[;#])/i, // = followed by quote and SQL delimiter

      /* SQL Functions */
      /(concat|char|ascii|ord|hex|unhex|substring|substr|mid|left|right|length|count|group_concat|version|database|schema|user|current_user|system_user|session_user|information_schema|table_name|column_name|load_file|into\s+outfile)\s*\(/i,

      /* Time-based blind injection */
      /(sleep|benchmark|pg_sleep|waitfor|delay)\s*\(/i,

      /* UNION-based injection */
      /(\bunion\b[\s\S]*?\bselect\b)/i,

      /* Stacked queries */
      /;\s*(select|insert|update|delete|drop|create|alter)/i,

      /* Hex encoding */
      /(0x[0-9a-f]+)/i,

      /* MySQL/PostgreSQL specific */
      /(@@version|@@datadir|pg_user|pg_database|current_database)/i,
    ];

    return patterns.some(pattern => pattern.test(decoded));
  } catch (error) {
    /* Invalid URL encoding is suspicious */
    return true;
  }
}

/* Check input for XSS attack patterns */
function hasXSSPattern(input: string): boolean {
  try {
    const decoded = decodeURIComponent(input);
    const patterns = [
      /* Script injection */
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /<script[\s\S]*?>/i, // Unclosed script tags
      /javascript\s*:/i,
      /vbscript\s*:/i,

      /* HTML injection */
      /<iframe[\s\S]*?>/i,
      /<frame[\s\S]*?>/i,
      /<frameset[\s\S]*?>/i,
      /<object[\s\S]*?>/i,
      /<embed[\s\S]*?>/i,
      /<applet[\s\S]*?>/i,
      /<base[\s\S]*?>/i,
      /<link[\s\S]*?>/i,
      /<meta[\s\S]*?http-equiv/i,
      /<form[\s\S]*?>/i,

      /* Event handlers */
      /on\w+\s*=/i,
      /<img[\s\S]*?on(error|load|abort|click|mouseover|mouseenter)\s*=/i,
      /<body[\s\S]*?on(load|unload|error)\s*=/i,
      /<svg[\s\S]*?on(load|error|click)\s*=/i,
      /<input[\s\S]*?on(focus|blur|change|click)\s*=/i,
      /<a[\s\S]*?on(click|mouseover)\s*=/i,

      /* Data URIs and encoding */
      /data\s*:\s*text\/html/i,
      /data\s*:\s*text\/javascript/i,
      /data\s*:\s*application\/x-javascript/i,
      /data\s*:\s*image\/svg\+xml/i,

      /* Expression and import */
      /expression\s*\(/i,
      /import\s*\(/i,
      /@import/i,

      /* HTML entities obfuscation */
      /&#x?[0-9a-f]+;/i,

      /* Style injection */
      /<style[\s\S]*?>/i,
      /style\s*=\s*["'][^"']*expression/i,
      /style\s*=\s*["'][^"']*javascript/i,
      /style\s*=\s*["'][^"']*@import/i,

      /* SVG-based XSS */
      /<svg[\s\S]*?>/i,
      /xmlns\s*=\s*["']?http:\/\/www\.w3\.org\/2000\/svg/i,

      /* HTML5 new vectors */
      /<audio[\s\S]*?>/i,
      /<video[\s\S]*?>/i,
      /<source[\s\S]*?>/i,
      /<track[\s\S]*?>/i,

      /* Template injection */
      /\{\{[\s\S]*?\}\}/,
      /\${[\s\S]*?}/,
      /<\?[\s\S]*?\?>/,
    ];

    return patterns.some(pattern => pattern.test(decoded));
  } catch (error) {
    /* Invalid URL encoding is suspicious */
    return true;
  }
}

/* Check for path traversal patterns */
function hasPathTraversalPattern(path: string): boolean {
  const patterns = [
    /* Basic traversal */
    /\.\.[\/\\]/,           // ../ or ..\
    /[\/\\]\.\.[\/\\]/,     // /../ or \..\
    /^\.\.$/,               // Exact ..
    /\.\.\./,               // ...

    /* URL encoded variants */
    /\.\.[%][2f|5c]/i,      // %2f or %5c
    /%2e%2e[\/\\]/i,        // %2e%2e/
    /%252e%252e/i,          // Double encoded %252e%252e
    /%c0%ae/i,              // Overlong UTF-8 encoding
    /%c1%9c/i,              // Overlong UTF-8 encoding

    /* Null byte injection */
    /\.\.[\/\\].*\x00/,     // ../ with null byte
    /%00/,                  // Null byte

    /* UNC paths (Windows) */
    /\\\\[^\\]/,            // UNC path \\server
    /^[a-z]:\\/i,           // Windows drive letter C:\

    /* Absolute paths */
    /^\/etc\//i,            // /etc/ (Unix)
    /^\/proc\//i,           // /proc/ (Unix)
    /^\/sys\//i,            // /sys/ (Unix)
    /^\/root\//i,           // /root/ (Unix)
    /^\/home\//i,           // /home/ (Unix)
    /^\/usr\//i,            // /usr/ (Unix)
    /^\/var\//i,            // /var/ (Unix)
    /^\/tmp\//i,            // /tmp/ (Unix)

    /* Semicolon tricks */
    /\.\.;/,                // ..;
    /;\.\.\//,              // ;../

    /* Backslash variants */
    /\.\.\\+/,              // ..\ ..\\
    /\\\.\.\\+/,            // \..\

    /* Mixed encodings */
    /\.[%]2e\//i,           // .%2e/
    /\.\.%c0%af/i,          // ..%c0%af

    /* Path truncation */
    /\.{3,}/,               // Multiple dots
  ];

  return patterns.some(pattern => pattern.test(path));
}

/* Check headers for XSS and path traversal attack patterns */
function checkSuspiciousHeaders(headers: Headers): string[] {
  const suspicious: string[] = [];
  const dangerousPatterns = [
    /* XSS in headers */
    /<script[\s\S]*?>/i,      // Script tags
    /javascript\s*:/i,         // JavaScript protocol
    /vbscript\s*:/i,           // VBScript protocol
    /on\w+\s*=/i,             // Event handlers
    /<iframe[\s\S]*?>/i,       // IFrame tags
    /<object[\s\S]*?>/i,       // Object tags
    /<embed[\s\S]*?>/i,        // Embed tags
    /data\s*:\s*text\/html/i,  // Data URI

    /* Path traversal in headers */
    /\.\.\/|\.\.\\/, // Path traversal
    /%2e%2e/i,                 // Encoded traversal

    /* CRLF injection */
    /\r|\n|%0d|%0a/i,         // Carriage return / Line feed

    /* Command injection */
    /[;&|`$()]/,              // Shell metacharacters

    /* LDAP injection */
    /[()=*]/,                 // LDAP special chars (in certain headers)

    /* XML injection */
    /<!(\[CDATA\[|DOCTYPE|ENTITY)/i,

    /* Host header injection */
    /^[^:]+:[^@]+@/,          // User:pass@host pattern

    /* Prototype pollution */
    /__proto__|constructor|prototype/i,
  ];

  /* Specific header validation */
  const sensitiveHeaders = ['host', 'referer', 'origin', 'x-forwarded-for', 'x-forwarded-host'];

  /* Headers that should be excluded from dangerous pattern checks */
  const safeHeaders = [
    'accept',
    'accept-encoding',
    'accept-language',
    'content-type',
    'user-agent',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-dest',
  ];

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    /* Skip pattern checks for safe standard headers */
    if (safeHeaders.includes(lowerKey)) {
      return;
    }

    /* Check all headers for dangerous patterns */
    if (dangerousPatterns.some(pattern => pattern.test(value))) {
      suspicious.push(key);
      return;
    }

    /* Additional validation for sensitive headers */
    if (sensitiveHeaders.includes(lowerKey)) {
      /* Check for multiple values (potential header splitting) */
      if (value.includes(',') && value.split(',').length > 10) {
        suspicious.push(key);
      }

      /* Check for suspiciously long header values */
      if (value.length > 1024) {
        suspicious.push(key);
      }
    }

    /* Check User-Agent for suspiciously short or long values */
    if (lowerKey === 'user-agent') {
      if (value.length < 10 || value.length > 512) {
        suspicious.push(key);
      }
    }
  });

  return suspicious;
}

/* Log security events for monitoring and threat detection */
function logSecurityEvent(c: Context<{ Bindings: Env }>, eventType: string, details?: any) {
  const requestId = c.req.header('X-Request-ID');
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';

  console.error('[SECURITY-MIDDLEWARE] 400: Security threat detected', {
    eventType,
    requestId,
    ip,
    userAgent,
    path: c.req.path,
    method: c.req.method,
    details,
    timestamp: getCurrentISOString()
  });
}
