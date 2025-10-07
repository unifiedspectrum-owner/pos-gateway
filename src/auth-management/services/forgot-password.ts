/* Libraries imports */
import { Context } from "hono";

/* Shared module imports */
import { POS_DB_GLOBAL } from "@shared/constants";
import { validatePayload } from "@shared/utils/validation";
import { getCurrentISOString } from "@shared/utils/time";
import { addHoursToCurrentDate, generateUUID } from "@shared/utils";

/* Auth management module imports */
import { forgotPasswordSchema } from "@auth-management/schemas";
import { CHECK_USER_EMAIL_EXISTS_QUERY, GET_USER_BY_ID_QUERY, CREATE_PASSWORD_RESET_TOKEN_QUERY, LOG_USER_ACTIVITY_QUERY } from "@auth-management/queries";
import { extractRequestInfo, sendPasswordResetEmail } from "@auth-management/utils";
import { PASSWORD_RESET_TOKEN_EXPIRATION_HOURS } from "@auth-management/constants";
import type { UserWithRole } from "@auth-management/types";

/* Forgot password service for generating password reset links */
export const forgotPassword = async (c: Context<{ Bindings: Env }>) => {
  try {
    const rawBody = await c.req.json();
    const requestInfo = extractRequestInfo(c);

    /* Validate request payload against forgot password schema */
    const validationResult = validatePayload(rawBody, forgotPasswordSchema, 'forgot password');

    if (!validationResult.isValid || !validationResult.data) {
      return c.json({
        success: false,
        message: 'VALIDATION_ERROR',
        error: validationResult.message,
        validation_errors: validationResult.errors,
        timestamp: getCurrentISOString()
      }, 400);
    }

    const { email } = validationResult.data;

    /* Get user ID by email */
    const userIdResult = await POS_DB_GLOBAL.prepare(CHECK_USER_EMAIL_EXISTS_QUERY)
      .bind(email.toLowerCase().trim()) // user email address
      .first<{ id: number }>();

    /* Silent delivery - always return success to prevent email enumeration */
    if (!userIdResult) {
      /* Log failed attempt for security monitoring */
      console.warn("Forgot password attempt for non-existent email:", {
        email,
        ip_address: requestInfo.ip_address,
        user_agent: requestInfo.user_agent,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: true,
        message: 'PASSWORD_RESET_SENT',
        data: 'If the email exists in our system, you will receive a password reset link shortly.',
        timestamp: getCurrentISOString()
      }, 200);
    }

    /* Get full user details by ID */
    const userResult = await POS_DB_GLOBAL.prepare(GET_USER_BY_ID_QUERY)
      .bind(userIdResult.id) // user_id to get full details
      .first<UserWithRole>();

    /* Check if user details retrieved successfully */
    if (!userResult) {
      return c.json({
        success: false,
        message: 'INTERNAL_SERVER_ERROR',
        error: 'Failed to retrieve user details',
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Check if user account is active */
    if (!userResult.is_active) {
      /* Log attempt on inactive account */
      await POS_DB_GLOBAL.prepare(LOG_USER_ACTIVITY_QUERY)
        .bind(
          userResult.id, // user_id for activity log
          null, // session_id (null for password reset)
          'forgot_password', // action_type
          requestInfo.ip_address, // ip_address
          requestInfo.user_agent, // user_agent
          null, // device_fingerprint
          'failure', // action_result (inactive account)
          null // performed_by (null for self-action)
        )
        .run();

      return c.json({
        success: true,
        message: 'PASSWORD_RESET_SENT',
        data: 'If the email exists in our system, you will receive a password reset link shortly.',
        timestamp: getCurrentISOString()
      }, 200);
    }

    /* Generate password reset token */
    const resetToken = generateUUID();
    const tokenExpiration = addHoursToCurrentDate(PASSWORD_RESET_TOKEN_EXPIRATION_HOURS);

    /* Store password reset token in database */
    const tokenResult = await POS_DB_GLOBAL.prepare(CREATE_PASSWORD_RESET_TOKEN_QUERY)
      .bind(
        userResult.id, // user_id for token ownership
        resetToken, // unique reset token
        tokenExpiration // token expiration timestamp
      )
      .run();

    if (!tokenResult.success) {
      /* Log error details for debugging */
      console.error('[FORGOT-PASSWORD] 500: Password reset token creation service error', {
        error: tokenResult.error,
        userId: userResult.id,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: 'INTERNAL_SERVER_ERROR',
        error: 'An error occurred while processing your request. Please try again.',
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Log successful password reset request */
    await POS_DB_GLOBAL.prepare(LOG_USER_ACTIVITY_QUERY)
      .bind(
        userResult.id, // user_id for activity log
        null, // session_id (null for password reset)
        'forgot_password', // action_type
        requestInfo.ip_address, // ip_address
        requestInfo.user_agent, // user_agent
        null, // device_fingerprint
        'success', // action_result
        null // performed_by (null for self-action)
      )
      .run();

    /* Send password reset email */
    const emailResult = await sendPasswordResetEmail({
      to: userResult.email,
      userEmail: userResult.email,
      userName: `${userResult.f_name} ${userResult.l_name}`,
      resetToken: resetToken
    });

    if (!emailResult.success) {
      /* Log error details for debugging */
      console.error('[FORGOT-PASSWORD] 500: Password reset email sending service error', {
        error: emailResult.error,
        userId: userResult.id,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: 'INTERNAL_SERVER_ERROR',
        error: 'An error occurred while sending the password reset email. Please try again.',
        timestamp: getCurrentISOString()
      }, 500);
    }

    return c.json({
      success: true,
      message: 'PASSWORD_RESET_SENT',
      data: 'If the email exists in our system, you will receive a password reset link shortly.',
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FORGOT-PASSWORD] 500: Forgot password service error', {
      error: errorMessage,
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: 'INTERNAL_SERVER_ERROR',
      error: 'An unexpected error occurred while processing your request. Please try again.',
      timestamp: getCurrentISOString()
    }, 500);
  }
};