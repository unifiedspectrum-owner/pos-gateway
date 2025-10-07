/* Libraries imports */
import { Context } from "hono";

/* Shared module imports */
import { getCurrentISOString } from "@shared/utils";

/* Generate a random CSRF token */
const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/* CSRF token generation service */
export const getCSRFToken = async (c: Context<{ Bindings: Env }>) => {
  try {
    /* Generate new CSRF token */
    const token1 = c.get('csrfToken');
    console.log('CSRF Token', token1)
    const token = generateCSRFToken();
    console.log(c.req.header('X-CSRF-Token'))

    /* Return CSRF token */
    return c.json({
      success: true,
      data: {
        csrf_token: token
      },
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[CSRF-SERVICE] 500: CSRF token generation error", {
      error: errorMessage,
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: "INTERNAL_SERVER_ERROR",
      error: "An unexpected error occurred while generating CSRF token",
      timestamp: getCurrentISOString()
    }, 500);
  }
};
