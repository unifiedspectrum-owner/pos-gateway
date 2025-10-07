/* Libraries imports */
import { Context } from "hono";

/* Shared module imports */
import { POS_DB_GLOBAL } from "@shared/constants";
import { validatePayload } from "@shared/utils/validation";
import { isISODateExpired, getCurrentISOString } from "@shared/utils";

/* Auth management module imports */
import { resetPasswordSchema } from "@auth-management/schemas";
import { GET_PASSWORD_RESET_TOKEN_QUERY, UPDATE_USER_PASSWORD_QUERY, MARK_PASSWORD_RESET_TOKEN_USED_QUERY, LOG_USER_ACTIVITY_QUERY } from "@auth-management/queries";
import { GET_USER_BY_ID_QUERY } from "@auth-management/queries";
import { extractRequestInfo, hashPassword, sendPasswordResetConfirmationEmail } from "@auth-management/utils";
import { UserWithRole } from "@auth-management/types";

/* Reset password service for updating user password using reset token */
export const resetPassword = async (c: Context<{ Bindings: Env }>) => {
  try {
    const rawBody = await c.req.json();
    const requestInfo = extractRequestInfo(c);

    /* Validate request payload against reset password schema */
    const validationResult = validatePayload(rawBody, resetPasswordSchema, 'reset password');

    if (!validationResult.isValid || !validationResult.data) {
      return c.json({
        success: false,
        message: 'VALIDATION_ERROR',
        error: validationResult.message,
        validation_errors: validationResult.errors,
        timestamp: getCurrentISOString()
      }, 400);
    }

    const { token, new_password } = validationResult.data;

    /* Check if token exists and is valid */
    const tokenResult = await POS_DB_GLOBAL.prepare(GET_PASSWORD_RESET_TOKEN_QUERY)
      .bind(token)
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

    /* Hash the new password */
    const hashedPassword = await hashPassword(new_password);

    /* Update user password */
    const currentTime = getCurrentISOString();
    const updateResult = await POS_DB_GLOBAL.prepare(UPDATE_USER_PASSWORD_QUERY)
      .bind(hashedPassword, tokenResult.user_id)
      .run();

    if (!updateResult.success) {
      /* Log error details for debugging */
      console.error('[PASSWORD-RESET] 500: Password update service error', {
        error: updateResult.error,
        userId: tokenResult.user_id,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: 'INTERNAL_SERVER_ERROR',
        error: 'An error occurred while updating password. Please try again.',
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Mark the reset token as used and log activity in parallel */
    const [tokenUpdateResult, activityLogResult] = await Promise.all([
      POS_DB_GLOBAL.prepare(MARK_PASSWORD_RESET_TOKEN_USED_QUERY)
        .bind(currentTime, token)
        .run(),
      POS_DB_GLOBAL.prepare(LOG_USER_ACTIVITY_QUERY)
        .bind(
          tokenResult.user_id, // user_id for activity log
          null, // session_id (null for password reset)
          'password_change', // action_type
          requestInfo.ip_address, // ip_address
          requestInfo.user_agent, // user_agent
          null, // device_fingerprint
          'success', // action_result
          null // performed_by (null for self-action)
        )
        .run()
    ]);

    /* Check if token marking failed */
    if (!tokenUpdateResult.success) {
      /* Log error details for debugging */
      console.error('[PASSWORD-RESET] 500: Token marking service error', {
        error: tokenUpdateResult.error,
        token: token,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: 'INTERNAL_SERVER_ERROR',
        error: 'An error occurred while marking token as used. Please try again.',
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Check if activity logging failed */
    if (!activityLogResult.success) {
      /* Log error details for debugging */
      console.error('[PASSWORD-RESET] 500: Activity logging service error', {
        error: activityLogResult.error,
        userId: tokenResult.user_id,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: 'INTERNAL_SERVER_ERROR',
        error: 'An error occurred while logging activity. Please try again.',
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Get user details for confirmation email */
    const userDetails = await POS_DB_GLOBAL.prepare(GET_USER_BY_ID_QUERY)
      .bind(tokenResult.user_id)
      .first<UserWithRole>();

    if (userDetails) {
      /* Send password reset confirmation email */
      const resetTime = getCurrentISOString();
      const emailResult = await sendPasswordResetConfirmationEmail({
        to: userDetails.email,
        userName: `${userDetails.f_name} ${userDetails.l_name}`,
        resetTime,
        ipAddress: requestInfo.ip_address
      });

      if (!emailResult.success) {
        /* Log error but don't fail the request - password was already reset successfully */
        console.error('[PASSWORD-RESET] 500: Password confirmation email service error', {
          error: emailResult.error,
          userId: tokenResult.user_id,
          email: userDetails.email,
          timestamp: getCurrentISOString()
        });
      }
    }

    /* Return success response */
    return c.json({
      success: true,
      message: 'PASSWORD_RESET_SUCCESS',
      data: {
        user_id: tokenResult.user_id,
        reset_at: getCurrentISOString()
      },
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PASSWORD-RESET] 500: Reset password service error', {
      error: errorMessage,
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: 'INTERNAL_SERVER_ERROR',
      error: 'An unexpected error occurred during password reset. Please try again.',
      timestamp: getCurrentISOString()
    }, 500);
  }
};