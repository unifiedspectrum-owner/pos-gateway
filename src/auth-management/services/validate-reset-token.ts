/* Libraries imports */
import { Context } from "hono";

/* Shared module imports */
import { getCurrentISOString } from "@shared/utils";
import { isISODateExpired } from "@shared/utils";

/* Auth management module imports */
import { GET_PASSWORD_RESET_TOKEN_QUERY } from "@auth-management/queries";
import { RESET_TOKEN_QUERY_PARAM } from "@auth-management/constants";

/* Validate password reset token service */
export const validateResetToken = async (c: Context<{ Bindings: Env }>) => {
  try {
    /* Get token from query parameters */
    const token = c.req.query(RESET_TOKEN_QUERY_PARAM);

    if (!token) {
      return c.json({
        success: false,
        message: 'TOKEN_MISSING',
        error: 'Reset token is required',
        timestamp: getCurrentISOString()
      }, 400);
    }

    /* Check if token exists and is valid */
    const tokenResult = await c.env.POS_DB_GLOBAL.prepare(GET_PASSWORD_RESET_TOKEN_QUERY)
      .bind(token) // reset token
      .first<{
        id: number;
        user_id: number;
        token: string;
        expires_at: string;
        used_at: string | null;
        created_at: string;
      }>();

    if (!tokenResult) {
      return c.json({
        success: false,
        message: 'TOKEN_NOT_FOUND',
        error: 'Reset token does not exist or is invalid',
        timestamp: getCurrentISOString()
      }, 404);
    }

    /* Check if token has already been used */
    if (Boolean(tokenResult.used_at)) {
      return c.json({
        success: false,
        message: 'TOKEN_ALREADY_USED',
        error: 'This reset token has already been used',
        timestamp: getCurrentISOString()
      }, 410);
    }

    /* Check if token has expired */
    if (isISODateExpired(tokenResult.expires_at)) {
      return c.json({
        success: false,
        message: 'TOKEN_EXPIRED',
        error: 'Reset token has expired',
        timestamp: getCurrentISOString()
      }, 410);
    }

    /* Token is valid */
    return c.json({
      success: true,
      message: 'TOKEN_VALID',
      data: {
        token_valid: true,
        user_id: tokenResult.user_id,
        expires_at: tokenResult.expires_at,
        created_at: tokenResult.created_at
      },
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RESET-TOKEN-VALIDATE] 500: Validate reset token service error', {
      error: errorMessage,
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: 'INTERNAL_SERVER_ERROR',
      error: 'An unexpected error occurred during token validation. Please try again.',
      timestamp: getCurrentISOString()
    }, 500);
  }
};