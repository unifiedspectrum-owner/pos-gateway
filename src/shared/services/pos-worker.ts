/* Shared module imports */
import { USER_CONTEXT_KEY } from "@shared/constants";
import { generateGatewayToken, getCurrentISOString } from "@shared/utils";
import { AuthenticatedContext } from "@shared/middleware";

/* Forward request to POS worker using service binding */
export const forwardToPOSWorker = async (c: AuthenticatedContext) => {
  try {
    if (!c.env.POS_BACKEND) {
      console.error("[POS-WORKER] 503: POS_BACKEND service binding not configured", {
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: "SERVICE_UNAVAILABLE",
        error: "POS worker service is not configured",
        timestamp: getCurrentISOString()
      }, 503);
    }

    /* Get authenticated user context from JWT middleware */
    const user = c.get(USER_CONTEXT_KEY);

    /* Get request ID for distributed tracing */
    const requestId = c.req.header('X-Request-ID');

    /* Generate gateway token for API Gateway to POS Backend authentication */
    const gatewayToken = await generateGatewayToken(user?.id ? user.id : 'public');

    /* Create request headers with gateway authentication token */
    const headers = new Headers(c.req.raw.headers);
    headers.set('X-Gateway-Token', `Bearer ${gatewayToken}`);

    /* Add authenticated user context to headers for POS Backend worker */
    if (user) {
      headers.set('X-User-Id', user.id);
      headers.set('X-Session-Id', user.session_id);
    }

    /* Add request ID for distributed tracing across workers */
    if (requestId) {
      headers.set('X-Request-ID', requestId);
    }

    /* Create forwarding request with gateway authentication headers */
    const request = new Request(c.req.raw.url, {
      method: c.req.raw.method,
      headers: headers,
      body: c.req.raw.body,
      cf: c.req.raw.cf,
    });

    /* Forward authenticated request to POS Backend worker via service binding */
    return await c.env.POS_BACKEND.fetch(request);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[POS-WORKER] 502: POS worker service error", {
      error: errorMessage,
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: "BAD_GATEWAY",
      error: "Failed to communicate with POS worker service",
      timestamp: getCurrentISOString()
    }, 502);
  }
};
