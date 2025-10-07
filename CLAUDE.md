# POS SaaS Platform Development Guide

# 🎨 Brand Guidelines & Design Theme

## Color Palette

- **Primary:** Pure Black `#000000`
- **Secondary:** Pure White `#FFFFFF`
- **Accent:** Neon Green `#00FF41`

### Supporting Colors

- **Dark Gray:** `#1A1A1A`
- **Light Gray:** `#F5F5F5`
- **Success Green:** `#10B981`
- **Warning Orange:** `#F59E0B`
- **Error Red:** `#EF4444`

---

## Typography

- **Headlines:** Inter / Roboto — Bold, clean, modern
- **Body Text:** Inter / Roboto — Regular weight
- **Accent Text:** Neon green highlights for CTAs and key metrics

---

## Visual Style

- **Aesthetic:** Futuristic, high-tech, professional
- **Layout:** Clean, minimal, with generous white space
- **Components:** Rounded corners, subtle shadows, neon green accents
- **Animations:** Smooth transitions, subtle hover effects, distinct loading states

---

## Brand Inspiration

Think:
- **Lime Studio aesthetic** (see reference images)
- **Modern SaaS design sensibility**
- **AI / Voice technology forward interface**

The visual identity is designed to convey innovation, clarity, and cutting-edge technology.

---

## Naming Conventions (CRITICAL - Follow Exactly)

### Code Structure
- **File Names**: kebab-case
  - Examples: `order-service.ts`, `inventory-manager.ts`, `voice-processor.ts`
- **Function Names**: camelCase
  - Examples: `createOrder()`, `updateInventory()`, `processVoiceCommand()`
- **Class Names**: PascalCase
  - Examples: `OrderManager`, `InventoryService`, `VoiceProcessor`
- **Constants**: SCREAMING_SNAKE_CASE
  - Examples: `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT_MS`
- **Environment Variables**: SCREAMING_SNAKE_CASE
  - Examples: `DATABASE_URL`, `JWT_SECRET`, `AI_MODEL_ID`

### Resource Identifiers
- **Tenant ID**: `tenant-{uuid}` or `{slug}`
  - Examples: `tenant-8f14e45f`, `acme-corp`
- **Branch ID**: `{tenantId}-br-{number}`
  - Example: `tenant-8f14e45f-br-001`
- **Device ID**: `{branchId}-dev-{number}`
  - Example: `tenant-8f14e45f-br-001-dev-01`
- **User ID**: `user-{uuid}`
  - Example: `user-a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Database Naming
- **Shared Database**: `pos-db-global`
- **Tenant's Database**: `pos-db-{tenant-slug}`
  - Examples: `pos-db-acme-corp`, `pos-db-wal-walmart-inc`
- **Queue Names**: `pos-{purpose}`
  - Examples: `pos-forecast`, `pos-notify`, `pos-train`, `pos-export`

### File & Key Naming
- **R2 Object Keys**: `{tenantId}/{category}/{filename}`
  - Examples:
    - `tenant-8f14e45f/assets/products/prod-123.jpg`
    - `tenant-8f14e45f/voice/cmd-20241201-001.wav`
    - `tenant-8f14e45f/exports/sales-2024-11.csv`
- **KV Keys**: `{tenantId}:{category}:{key}`
  - Examples:
    - `tenant-8f14e45f:config:timezone`
    - `tenant-8f14e45f:sync:device-001:cursor`
    - `tenant-8f14e45f:cache:products:list`
- **Durable Object IDs**: `{service}:{tenantId}:{scope}`
  - Examples:
    - `order:tenant-8f14e45f:br-001`
    - `inventory:tenant-8f14e45f:br-001`
    - `socket:tenant-8f14e45f:br-001`
    - `forecast:tenant-8f14e45f`

## Multi-Tenancy Implementation

### SME Tenants (Shared Infrastructure)
- Single Worker handles all SME tenants
- Dedicated D1 database, KV Namespace, R2 Buckets per tenant
- Shared Durable Object namespaces (tenant ID in object name)

### Enterprise Tenants (Dedicated Infrastructure)
- Dedicated Worker per tenant
- Dedicated D1 database per tenant
- Separate R2 buckets or dedicated prefixes
- Isolated Durable Object instances

## Authentication & Authorization

### Role-Based Access Control
- **super-admin**: Full tenant access
- **admin**: Branch-level management
- **accountant**: POS operations only
- **support**: Read-only access

### Security Requirements

#### Core Security Checks
- Strict JWT signature verification using RSA-256 private/public key pair
- Device binding validation comparing current `device_id` with initial login's device fingerprint
- Immediate revocation status check against Redis blacklist
- Automatic expiration of old refresh tokens upon issuance of new ones

#### Enhanced Protection Measures
- Implement replay attack prevention using JTI (JWT ID) tracking
- Add IP address consistency checks (with configurable tolerance for mobile users)
- Enforce refresh token rotation with one-time-use policy
- Set maximum lifetime for refresh token chains (e.g., 30 days)

#### Password & Authentication Security
- Enforce password policies using zxcvbn with minimum entropy
- Use bcrypt/Argon2 for password storage
- Mitigate brute force attacks via rate limiting (5 attempts → lockout)
- Implement device fingerprinting
- Optional IP whitelisting for corporate networks

#### Refresh Token Security
- Store only SHA-256 hashes in database
- Encrypt at rest using AES-256-GCM
- Optional token rotation on each refresh
- Endpoint to revoke all tokens for a user
- Monitor and log failed refresh attempts
- Alert on suspicious activity (geolocation changes)

## API Specifications

### Security Headers & Middleware

#### Implemented Security Middleware (CRITICAL ORDER)
1. **Request Tracing** (`requestId`)
   - Adds unique `X-Request-ID` header for debugging and distributed tracing
   - Must be FIRST to track all requests including rejected ones

2. **Logging** (`logger`)
   - Logs all requests with method, path, status code, and response time
   - Captures all requests including security rejections

3. **Performance Timing** (`timing`)
   - Adds `Server-Timing` header for performance monitoring
   - Measures total request processing time

4. **Body Size Limit** (`bodyLimit`)
   - **100KB maximum** request body size
   - Prevents DoS attacks from large payloads
   - MUST be before body parsing

5. **Security Headers** (`secureHeaders`)
   - **Content Security Policy (CSP)**: Controls allowed resource sources
     - `defaultSrc: ['self']` - Only same origin by default
     - `scriptSrc: ['self', 'unsafe-inline']` - Scripts from same origin + inline
     - `objectSrc: ['none']` - Block plugins (Flash, Java, etc.)
     - `frameSrc: ['none']` - Prevent clickjacking
   - **HSTS**: `max-age=31536000; includeSubDomains; preload` - Force HTTPS for 1 year
   - **X-Content-Type-Options**: `nosniff` - Prevent MIME sniffing attacks
   - **X-Frame-Options**: `DENY` - Block iframe embedding
   - **X-XSS-Protection**: `1; mode=block` - Enable XSS filter in older browsers
   - **Referrer-Policy**: `strict-origin-when-cross-origin` - Control referrer information
   - **Permissions-Policy**: Block camera, microphone, geolocation access

6. **Rate Limiting** (`rateLimiter`)
   - **100 requests per 15 minutes** per IP address
   - Uses `draft-7` standard headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`)
   - Extracts client IP from `cf-connecting-ip` or `x-forwarded-for` headers
   - Blocks abusive requests BEFORE expensive operations

7. **CORS Configuration** (`cors`)
   - Origin whitelist via `ALLOWED_ORIGINS` constant
   - Allowed methods: GET, POST, PUT, DELETE, OPTIONS
   - Allowed headers: Content-Type, Authorization, X-CSRF-Token
   - **Credentials enabled** for cookie/token authentication
   - **24-hour preflight cache** (`max-age=86400`)
   - MUST be BEFORE CSRF for preflight OPTIONS to work

8. **CSRF Protection** (`csrf`)
   - Validates CSRF tokens from allowed origins only
   - Prevents Cross-Site Request Forgery attacks
   - Token must be sent in `X-CSRF-Token` header
   - After CORS, before routes

9. **Response Compression** (`compress`)
   - Enables gzip/deflate compression
   - MUST be LAST to compress final response

#### Caching Strategy (Optional - Commented Example)
- **ETag headers**: Generated automatically for cache validation
- **Cache-Control directives**:
  - Static resources: `public, max-age=3600` (1 hour)
  - API data: `private, max-age=300` (5 minutes)
  - Sensitive routes: `no-store, no-cache, must-revalidate`
  - Mutations (POST/PUT/DELETE): `no-store, no-cache`

### Error Handling & Response

#### Standardized Error Response Format
All errors return consistent JSON structure:
```json
{
  "success": false,
  "message": "ERROR_CODE_IN_CAPS",
  "error": "Descriptive error message",
  "timestamp": "2025-10-06T10:30:00.000Z"
}
```

**Example responses:**
```json
// 400 Validation Error
{
  "success": false,
  "message": "VALIDATION_ERROR",
  "error": "Invalid request body: email is required",
  "timestamp": "2025-10-06T10:30:00.000Z"
}

// 401 Unauthorized
{
  "success": false,
  "message": "UNAUTHORIZED",
  "error": "No authentication token provided",
  "timestamp": "2025-10-06T10:30:00.000Z"
}

// 404 Not Found
{
  "success": false,
  "message": "NOT_FOUND",
  "error": "User with ID 123 not found",
  "timestamp": "2025-10-06T10:30:00.000Z"
}

// 500 Internal Server Error
{
  "success": false,
  "message": "INTERNAL_SERVER_ERROR",
  "error": "An unexpected error occurred",
  "timestamp": "2025-10-06T10:30:00.000Z"
}
```

#### Error Types & Status Codes
- **ValidationError / ZodError**: 400 - `VALIDATION_ERROR`
- **UnauthorizedError**: 401 - `UNAUTHORIZED`
- **ForbiddenError**: 403 - `FORBIDDEN`
- **NotFoundError**: 404 - `NOT_FOUND`
- **ConflictError**: 409 - `CONFLICT`
- **Rate Limit Errors**: 429 - `RATE_LIMIT_EXCEEDED`
- **DatabaseError**: 500 - `DATABASE_ERROR`
- **ExternalServiceError**: 502 - `EXTERNAL_SERVICE_ERROR`
- **Default**: 500 - `INTERNAL_SERVER_ERROR`

#### Error Handler Implementation
- Global error handler (`errorHandler`) catches all thrown errors
- Logs errors with Request ID, path, message, and stack trace
- Returns appropriate status codes based on error type
- Includes error details only in development environment
- 404 handler (`notFoundHandler`) for undefined routes
- Located in: `src/middleware/errorHandler.ts`

#### Security Best Practices
- Provide clear but secure error responses (avoid information leakage)
- Never expose stack traces or internal details in production
- Include security challenge requirements for suspicious refresh attempts
- Implement graceful degradation for logging system failures
- Silent delivery for password reset (never reveal if email/mobile exists)
- Time-bounded responses (1-3 seconds delay to prevent timing attacks)

### Rate Limiting

#### Global Rate Limits
- **API Gateway**: 100 requests per 15 minutes per IP
- **Standard Headers**: `draft-7` (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
- **IP Detection**: Cloudflare `cf-connecting-ip` → `x-forwarded-for` → fallback

#### Endpoint-Specific Limits (To Implement)
- **Password Reset**: 3 attempts/hour per email/mobile, 10 attempts/day per IP
- **API Requests**: 100 requests/second per tenant (to be configured per tenant)
- **Logout Requests**: Rate limited to prevent DoS attacks
- **Authentication**: 5 failed attempts → account lockout

#### Rate Limit Response
```json
{
  "success": false,
  "message": "RATE_LIMIT_EXCEEDED",
  "error": "Too many requests. Please try again later.",
  "timestamp": "2025-10-06T10:30:00.000Z"
}
```
**Headers**:
- `RateLimit-Limit: 100`
- `RateLimit-Remaining: 0`
- `RateLimit-Reset: 1728234567`

## Performance Requirements

### Response Time Benchmarks
- **API Performance**: <100ms average response time
- **Database Performance**: <50ms average query execution time
- **Real-Time Communication**: <10ms WebSocket message delivery
- **File Handling**: <2 seconds for 10MB uploads

### Optimization Strategies
- Redis caching for frequently accessed data
- Database connection pooling (50-100 connections)
- Gzip compression for API responses
- Pagination for large datasets (default: 25 records)
- Proper indexing on all query patterns
- Read replicas for reporting queries
- Protocol buffers instead of JSON for WebSocket messages
- Multi-part uploads for large files
- Direct-to-S3 uploads with pre-signed URLs
- CDN for file distribution

### Scalability Targets
- **Multi-Tenancy**: Support 10,000+ tenants
- **Concurrent Users**: Handle 100,000+ concurrent users
- **Transaction Volume**: Process 1 million+ daily transactions
- **Availability**: 99.9% uptime SLA (~43 minutes downtime/month)

## Security & Compliance

### Data Protection
- **Encryption**: AES-256 for sensitive data at rest, TLS 1.2+ for communications
- **Input Security**: Sanitize all inputs, use parameterized SQL queries
- **Database**: TDE (Transparent Data Encryption) for tenant data

### Compliance Requirements
- **GDPR**: Support data subject requests & EU data residency
- **PCI DSS**: Encrypt payment data, conduct quarterly scans, write code to be certifiable by PCI DSS auditors
- **ISO 20007**: Code should comply and be certifiable by ISO 20007 auditors
- **HIPAA**: Ensure PHI protection with audit logs
- **Security Best Practices**: Follow web security, mobile security, and backend API recommendations

### Logging & Monitoring

#### Comprehensive Logging
- Include `tenant_id` in all log entries
- Log levels: ERROR, WARN, INFO, DEBUG
- Use structured logging (JSON format)
- Separate logs by tenant for enterprise customers
- **Privacy**: Mask private data in logs, store only hashed email/mobile values

#### Security Logging
Structure logs to include:
- Timestamp (UTC)
- User ID (hashed)
- Device fingerprint hash
- IP address (anonymized where required by GDPR)
- Token issuance/expiration times
- Security check outcomes

#### Alert Triggers
- Rapid consecutive refresh attempts
- Geographic location jumps
- Device fingerprint mismatches
- Token reuse attempts
- Mass logouts (potential breach)
- Privileged account activities
- Burst requests (potential scraping)
- Unrecognized devices querying multiple accounts

## Code Quality Standards

### TypeScript Configuration
- Enable strict mode in `tsconfig.json`
- Avoid `any` types; use proper interfaces/types
- Implement comprehensive error handling with custom error classes

### Import Path Standards
- **Use absolute imports**: Always use TypeScript path aliases defined in `tsconfig.json` (e.g., `@shared/types`, `@modules/tenant-management`)
- **Avoid relative imports**: Do not use relative paths like `../config` or `../../utils`
- **Exception for barrel exports**: Only use relative imports within barrel export files (index.ts) to export from same directory
- **Consistent aliasing**: Follow established path mapping for clean, maintainable imports
- **Inline imports preferred**: Use single-line imports when importing multiple items from the same module for better readability and consistency
  ```typescript
  // Preferred
  import { baseEmailStyles, themeStyles, componentStyles, EMAIL_ICONS, generateEmailHeader, generateEmailFooter, EMAIL_CONTENT, COMPANY_INFO } from '@shared/templates';

  // Avoid multi-line imports unless necessary for very long import lists
  import {
    baseEmailStyles,
    themeStyles,
    componentStyles,
    EMAIL_ICONS
  } from '@shared/templates';
  ```

### Testing Requirements
- **Unit Tests**: 80%+ coverage for all services (Jest/Vitest)
- **Integration Tests**: Validate API contracts (Supertest/Postman)
- **E2E Tests**: Critical user flows (Cypress/Playwright)

### Code Formatting
- **ESLint**: Airbnb/Standard config + custom rules
- **Prettier**: Auto-format on commit (`.prettierrc`)

### Code Comments Standards
- **Import Organization**: Group imports by category with section comments
  - `/* Libraries imports */` - Third-party libraries and packages
  - `/* Shared module imports */` - Internal shared modules and utilities from @shared
  - `/* [Module Name] module imports */` - Module-specific internal imports (e.g., `/* Tenant module imports */`, `/* Payment module imports */`)
- **Inline Comments**: Use `/* ... */` for concise single-line explanations
  - Explain purpose of exported constants and configurations
  - Document router initialization and endpoint functionality
  - Describe complex business logic and data transformations
- **Barrel Export Files**: Use consistent commenting format for index.ts files
  - Start with main category comment: `/* [Category] module exports */`
  - Add specific comments above each export explaining its purpose
  - Separate logical groups with blank lines for readability
  - Example format:
    ```typescript
    /* Shared configuration module exports */
    
    /* Environment variables and Cloudflare bindings */
    export * from './env-config';
    
    /* Application constants and default values */
    export * from './constants';
    ```
- **TypeScript Interface Files**: Use consistent structure for type definition files
  - Start with file header: `/* TypeScript interfaces for [domain] data structures */`
  - Add interface-level comments describing purpose: `/* [Description] */`
  - Keep property definitions clean without inline comments
  - Group related interfaces logically within the file
  - Example format:
    ```typescript
    /* TypeScript interfaces for communication service data structures */
    
    /* Email message composition parameters */
    export interface EmailParams {
      from: string;
      to: string;
      subject: string;
    }
    
    /* Email operation response structure */
    export interface EmailResponse {
      success: boolean;
      messageId?: string;
    }
    ```
- **Comment Style**: Keep comments concise and focused on "why" rather than "what"

### Error Logging Standards
- **Structured Error Logging**: Use consistent format for all error logging
  - Always include `/* Log error details for debugging */` comment before error logs
  - Extract error message first, then use structured objects with context and timestamp
  - Include relevant parameters/identifiers for debugging context
  - Always use `generateCurrentTimestamp()` for timestamp consistency
  - Provide meaningful fallback error messages for better debugging
  - Example format:
    ```typescript
    } catch (error) {
      /* Log error details for debugging */
      const errorMessage = error instanceof Error ? error.message : "Meaningful fallback error description"
      console.error("Operation description service error:", {
        error: errorMessage,
        relevantParameter: paramValue, /* Optional context */
        timestamp: generateCurrentTimestamp()
      });

      return c.json({
        success: false,
        message: "INTERNAL_SERVER_ERROR",
        error: errorMessage,
        timestamp: generateCurrentTimestamp()
      }, 500);
    }
    ```
- **Service Operation Logging**: Use structured format for service operation logs with service tags and HTTP status codes
  - Use bracketed service tags with descriptive status codes: `[SERVICE-NAME] STATUS: Description`
  - Include structured objects with relevant context for debugging
  - Example format:
    ```typescript
    /* Service operation successful */
    console.log('[USER-AUTH] 200: Successful user authentication', {
      userId: userResult.id,
      email: userResult.email,
      sessionId
    });

    /* Service operation with error conditions */
    console.log('[2FA-VERIFY] 401: Invalid 2FA token', {
      userId: user_id,
      email: userResult.email,
      remainingAttempts
    });
    ```
- **Error Message Extraction**: Always extract error message into a variable first using meaningful fallback messages
- **Error Log Naming**: Use descriptive service operation names (e.g., "User creation service error", "2FA setup service error")

### API Documentation
- **Swagger UI**: Integrate with OpenAI for all API routes
- Include dynamic request and response schemas
- Document all public APIs thoroughly
- Provide request/response examples

### Secrets Management
- Never hardcode credentials
- Use Cloudflare Secrets or HashiCorp Vault
- Rotate keys quarterly

## Implementation Guidelines

### Error Handling

#### Global Error Handler Pattern
All routes are automatically wrapped by global error handlers:
- **Error Handler**: `app.onError(errorHandler)` - Catches all thrown errors
- **404 Handler**: `app.notFound(notFoundHandler)` - Handles undefined routes
- Located in: `src/middleware/errorHandler.ts`

#### Route Error Handling
Simply throw errors in routes - they're automatically caught and formatted:
```typescript
app.get('/api/users/:id', async (c) => {
  const user = await db.getUser(c.req.param('id'));

  if (!user) {
    // Automatically caught by global error handler
    const error = new Error('User not found');
    error.name = 'NotFoundError';  // Maps to 404 status
    throw error;
  }

  return c.json(user);
});
```

#### Error Logging Standards
- Extract error message first: `const errorMessage = error instanceof Error ? error.message : "Fallback message"`
- Use structured logging with context:
  ```typescript
  console.error("Service operation error:", {
    error: errorMessage,
    relevantContext: value,
    timestamp: generateCurrentTimestamp()
  });
  ```
- Always include Request ID from `X-Request-ID` header
- Log all failure responses with appropriate log levels
- All events should be logged for troubleshooting, security analysis, and audit purposes

#### Custom Error Classes (Optional)
Create custom error classes with statusCode and code properties:
```typescript
class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
}
```

### Database Operations
- Always include tenant isolation in queries
- Use proper indexing strategies
- Implement connection pooling
- Use materialized views for complex aggregations

### Real-Time Features
- Deploy WebSocket servers in multiple regions
- Implement message batching for high-frequency updates
- Use Durable Objects for real-time state management

### File Operations
- Implement multi-part uploads
- Use CDN for file distribution
- Apply proper access controls on R2 objects

## Deployment & Operations

### Deployment Strategy
- Zero-downtime deployment pipelines
- Multi-AZ deployments for critical services
- Automated failover mechanisms

### Monitoring
- Comprehensive monitoring (Prometheus + Grafana)
- SIEM integration for real-time security monitoring
- Anomaly detection for unusual access patterns
- Regular penetration testing

### Performance Monitoring
- Auto-scaling based on CPU/memory metrics
- Database partitioning for high-volume tables
- Write-ahead logging for critical transactions
- Queue non-critical operations (analytics, notifications)

## Important Notes

1. **Tenant Isolation**: Every database query MUST include proper tenant filtering
2. **Security First**: All security measures are mandatory, not optional
3. **Performance**: Meet all specified benchmarks
4. **Compliance**: Code must be auditable for PCI DSS and ISO 20007
5. **Logging**: Always include tenant context and mask sensitive data
6. **Error Handling**: Comprehensive error handling with proper logging
7. **Testing**: Maintain high test coverage across all layers
8. **Documentation**: Keep API documentation current and comprehensive

## Folder Structure
Follow Cloudflare Workers official documentation conventions strictly when organizing code files and directories.