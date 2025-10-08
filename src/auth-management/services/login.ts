/* Core routing framework imports */
import { Context } from "hono";

/* Shared module imports */
import { validatePayload } from "@shared/utils/validation";
import { getCurrentISOString } from "@shared/utils";

/* Auth management module imports */
import { loginSchema } from "@auth-management/schemas";
import { CHECK_USER_EMAIL_EXISTS_QUERY, GET_USER_BY_ID_QUERY, GET_USER_FAILED_ATTEMPTS_QUERY, LOCK_USER_ACCOUNT_QUERY } from "@auth-management/queries";
import { extractRequestInfo, verifyPassword, isAccountLocked, shouldLockAccount, calculateAccountLockExpiration, logSuccessfulLogin, logFailedLogin, logActivity, createSessionAndTokens } from "@auth-management/utils";
import { MAX_CONSECUTIVE_FAILED_ATTEMPTS } from "@auth-management/constants";
import type { LoginResponse, UserWithRole } from "@auth-management/types";

/* User login service with comprehensive authentication and session management */
export const login = async (c: Context<{ Bindings: Env }>) => {
  try {
    const rawBody = await c.req.json();
    const requestInfo = extractRequestInfo(c);

    /* Validate request payload against login schema */
    const validationResult = validatePayload(rawBody, loginSchema, 'user login');

    if (!validationResult.isValid || !validationResult.data) {
      return c.json({
        success: false,
        message: 'VALIDATION_ERROR',
        error: validationResult.message,
        validation_errors: validationResult.errors,
        timestamp: getCurrentISOString()
      }, 400);
    }

    const { email, password, remember_me } = validationResult.data;

    /* Get user ID by email */
    const userIdResult = await c.env.POS_DB_GLOBAL.prepare(CHECK_USER_EMAIL_EXISTS_QUERY)
      .bind(email.toLowerCase().trim()) // user email address for authentication
      .first<{ id: number }>();

    /* Check if user exists */
    if (!userIdResult) {
      return c.json({
        success: false,
        message: 'INVALID_CREDENTIALS',
        error: 'Invalid email or password',
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Get full user details by ID with role information */
    const userResult = await c.env.POS_DB_GLOBAL.prepare(GET_USER_BY_ID_QUERY)
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

    /* Verify password */
    const isPasswordValid = await verifyPassword(password, userResult.password_hash);

    if (!isPasswordValid) {
      try {
        /* Update failed login statistics and log attempt */
        const loginResult = await logFailedLogin(c.env, userResult.id, requestInfo, 'user_login');

        /* Check if login operation failed */
        if (!loginResult.success) {
          /* Log error details for debugging */
          console.error("Failed login statistics or activity logging error:", {
            statsSuccess: loginResult.statsSuccess,
            activitySuccess: loginResult.activitySuccess,
            statsError: loginResult.statsError,
            activityError: loginResult.activityError,
            userId: userResult.id,
            timestamp: getCurrentISOString()
          });

          return c.json({
            success: false,
            message: 'INTERNAL_SERVER_ERROR',
            error: 'An error occurred while processing login attempt',
            timestamp: getCurrentISOString()
          }, 500);
        }

        /* Check if account should be locked after this failed attempt */
        const failedAttemptsResult = await c.env.POS_DB_GLOBAL.prepare(GET_USER_FAILED_ATTEMPTS_QUERY)
          .bind(userResult.id) // user_id to check failed attempts
          .first<{ consecutive_failed_attempts: number; last_failed_login_at: string }>();

        if (failedAttemptsResult && shouldLockAccount(failedAttemptsResult.consecutive_failed_attempts)) {
          /* Lock the account */
          const lockExpiration = calculateAccountLockExpiration();
          await c.env.POS_DB_GLOBAL.prepare(LOCK_USER_ACCOUNT_QUERY)
            .bind(
              lockExpiration, // ISO string for account_locked_until
              userResult.id   // user_id to lock
            )
            .run();

          /* Log account lock activity */
          await logActivity(c.env, userResult.id.toString(), null, 'account_locked', requestInfo, 'success', null);

          return c.json({
            success: false,
            message: 'ACCOUNT_LOCKED',
            error: `Account has been locked until ${lockExpiration} due to multiple failed login attempts.`,
            timestamp: getCurrentISOString()
          }, 423);
        }

        /* Calculate remaining attempts */
        const currentFailedAttempts = failedAttemptsResult?.consecutive_failed_attempts || 1;
        const remainingAttempts = Math.max(0, MAX_CONSECUTIVE_FAILED_ATTEMPTS - currentFailedAttempts);

        return c.json({
          success: false,
          message: 'INVALID_CREDENTIALS',
          error: `Invalid email or password. ${remainingAttempts} attempts remaining.`,
          timestamp: getCurrentISOString()
        }, 401);

      } catch (error) {
        /* Log error details for debugging */
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while processing login attempt'
        console.error("Failed login processing error:", {
          error: errorMessage,
          userId: userResult.id,
          timestamp: getCurrentISOString()
        });

        return c.json({
          success: false,
          message: 'INTERNAL_SERVER_ERROR',
          error: errorMessage,
          timestamp: getCurrentISOString()
        }, 500);
      }
    }

    /* Check if user account is locked */
    if (isAccountLocked(userResult)) {
      /* Log failed login attempt */
      await logActivity(c.env, userResult.id.toString(), null, 'user_login', requestInfo, 'failure', null);

      return c.json({
        success: false,
        message: 'ACCOUNT_LOCKED',
        error: `Account is locked until ${userResult.account_locked_until} due to too many failed attempts`,
        timestamp: getCurrentISOString()
      }, 403);
    }

    /* Check if user has 2FA enabled */
    if (Boolean(userResult.is_2fa_enabled)) {
      console.log('[LOGIN] User has 2FA enabled, requiring 2FA verification', {
        userId: userResult.id,
        email: userResult.email,
        timestamp: getCurrentISOString()
      });

      /* Return 2FA required response instead of tokens */
      const twoFactorResponse: LoginResponse = {
        requires_2fa: true,
        is_2fa_authenticated: false,
        user: {
          id: userResult.id,
          email: userResult.email,
          name: `${userResult.f_name}${userResult.l_name}`,
          role: userResult.role_name,
          is_2fa_required: Boolean(userResult.is_2fa_required) && !Boolean(userResult.is_2fa_enabled)
        }
      };

      return c.json({
        success: true,
        message: "TWO_FACTOR_REQUIRED",
        data: twoFactorResponse,
        timestamp: getCurrentISOString()
      }, 200);
    }

    /* Create session and generate tokens */
    const sessionResult = await createSessionAndTokens(c.env, userResult, requestInfo, remember_me);

    if (!sessionResult.success) {
      return c.json({
        success: false,
        message: 'INTERNAL_SERVER_ERROR',
        error: sessionResult.error || 'Failed to create user session',
        timestamp: getCurrentISOString()
      }, 500);
    }

    if (!sessionResult.sessionId || !sessionResult.accessToken || !sessionResult.refreshToken) {
      return c.json({
        success: false,
        message: 'INTERNAL_SERVER_ERROR',
        error: 'Session or token generation incomplete',
        timestamp: getCurrentISOString()
      }, 500);
    }

    const { sessionId, accessToken, refreshToken } = sessionResult;

    /* Update successful login statistics and log activity */
    const loginResult = await logSuccessfulLogin(c.env, userResult.id, sessionId, requestInfo, 'user_login');

    /* Check if login operation failed */
    if (!loginResult.success) {
      /* Log error details for debugging */
      console.error("Successful login statistics or activity logging error:", {
        statsSuccess: loginResult.statsSuccess,
        activitySuccess: loginResult.activitySuccess,
        statsError: loginResult.statsError,
        activityError: loginResult.activityError,
        userId: userResult.id,
        sessionId,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: 'INTERNAL_SERVER_ERROR',
        error: 'An error occurred while completing login process',
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Prepare response */
    const loginResponse: LoginResponse = {
      accessToken,
      refreshToken, // Using session ID as refresh token for simplicity
      session_id: sessionId,
      requires_2fa: Boolean(userResult.is_2fa_enabled),
      is_2fa_authenticated: false,
      user: {
        id: userResult.id,
        email: userResult.email,
        name: `${userResult.f_name}${userResult.l_name}`,
        role: userResult.role_name,
        is_2fa_required: Boolean(userResult.is_2fa_required) && !Boolean(userResult.is_2fa_enabled)
      }
    };

    return c.json({
      success: true,
      data: loginResponse,
      message: 'LOGIN_SUCCESSFUL',
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during login. Please try again.'
    console.error("User login service error:", {
      error: errorMessage,
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: 'INTERNAL_SERVER_ERROR',
      error: errorMessage,
      timestamp: getCurrentISOString()
    }, 500);
  }
};