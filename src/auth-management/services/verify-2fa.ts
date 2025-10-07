/* Core routing framework imports */
import { Context } from "hono";
import { authenticator } from "otplib";

/* Shared module imports */
import { POS_DB_GLOBAL } from "@shared/constants";
import { validatePayload } from "@shared/utils/validation";
import { getCurrentISOString } from "@shared/utils";

/* Auth management module imports */
import { twoFactorValidationSchema } from "@auth-management/schemas";
import { TWO_FA_TYPES } from "@auth-management/constants";
import {
  GET_USER_BY_ID_QUERY,
  GET_USER_2FA_SECRET_QUERY,
  UPDATE_2FA_FAILED_ATTEMPTS_QUERY,
  RESET_2FA_FAILED_ATTEMPTS_QUERY,
  LOCK_2FA_AFTER_MAX_ATTEMPTS_QUERY,
  UPDATE_BACKUP_CODES_QUERY
} from "@auth-management/queries";
import {
  extractRequestInfo,
  is2FALocked,
  should2FABeLocked,
  calculate2FALockExpiration,
  logSuccessfulLogin,
  logActivity,
  createSessionAndTokens,
  verifySecret
} from "@auth-management/utils";
import type { LoginResponse, UserWithRole, TwoFactorAuthData } from "@auth-management/types";

/* 2FA verification service with token validation and session creation */
export const verify2FA = async (c: Context<{ Bindings: Env }>) => {
  try {
    const rawBody = await c.req.json();
    const requestInfo = extractRequestInfo(c);

    /* Validate request payload against 2FA validation schema */
    const validationResult = validatePayload(rawBody, twoFactorValidationSchema, '2FA token validation');

    if (!validationResult.isValid || !validationResult.data) {
      return c.json({
        success: false,
        message: 'VALIDATION_ERROR',
        error: validationResult.message,
        validation_errors: validationResult.errors,
        timestamp: getCurrentISOString()
      }, 400);
    }

    const { user_id, type, code } = validationResult.data;

    /* Get user information by ID */
    const userResult = await POS_DB_GLOBAL.prepare(GET_USER_BY_ID_QUERY)
      .bind(user_id) // user_id for user lookup
      .first<UserWithRole>();

    /* Check if user exists */
    if (!userResult) {
      console.log('[2FA-VERIFY] 401: User not found', { userId: user_id });
      return c.json({
        success: false,
        message: 'USER_NOT_FOUND',
        error: 'User not found or inactive',
        timestamp: getCurrentISOString()
      }, 404);
    }

    /* Check if user has 2FA enabled */
    if (!Boolean(userResult.is_2fa_enabled)) {
      console.log('[2FA-VERIFY] 400: User does not have 2FA enabled', {
        userId: user_id,
        email: userResult.email
      });
      return c.json({
        success: false,
        message: '2FA_NOT_ENABLED',
        error: 'Two-factor authentication is not enabled for this user',
        timestamp: getCurrentISOString()
      }, 400);
    }

    /* Get user's 2FA secret and settings */
    const twoFactorResult = await POS_DB_GLOBAL.prepare(GET_USER_2FA_SECRET_QUERY)
      .bind(user_id) // user_id for 2FA settings lookup
      .first<TwoFactorAuthData>();

    if (!twoFactorResult || !Boolean(twoFactorResult.is_active)) {
      console.log('[2FA-VERIFY] 404: 2FA record not found or inactive', {
        userId: user_id,
        email: userResult.email
      });
      return c.json({
        success: false,
        message: '2FA_NOT_CONFIGURED',
        error: 'Two-factor authentication is not properly configured',
        timestamp: getCurrentISOString()
      }, 404);
    }

    /* Check if 2FA is locked */
    if (is2FALocked(twoFactorResult)) {
      const lockReason = Boolean(twoFactorResult.is_locked)
        ? `locked until ${twoFactorResult.locked_until}`
        : 'due to too many failed attempts';

      console.log('[2FA-VERIFY] 423: 2FA locked', {
        userId: user_id,
        email: userResult.email,
        failedAttempts: twoFactorResult.failed_attempts,
        maxAttempts: twoFactorResult.max_failed_attempts,
        isLocked: Boolean(twoFactorResult.is_locked),
        lockedUntil: twoFactorResult.locked_until
      });

      return c.json({
        success: false,
        message: '2FA_LOCKED',
        error: `Two-factor authentication is ${lockReason}`,
        timestamp: getCurrentISOString()
      }, 423);
    }

    /* Handle different 2FA types */
    let isTokenValid = false;
    let updatedBackupCodes: string[] | null = null;

    if (type === TWO_FA_TYPES.TOTP) {
      /* Verify TOTP token using authenticator */
      isTokenValid = authenticator.verify({
        token: code,
        secret: twoFactorResult.secret
      });
    } else if (type === TWO_FA_TYPES.BACKUP) {
      /* Verify backup code */
      if (!twoFactorResult.backup_codes) {
        console.log('[2FA-VERIFY] 400: No backup codes available', {
          userId: user_id,
          email: userResult.email
        });

        return c.json({
          success: false,
          message: 'NO_BACKUP_CODES',
          error: 'No backup codes are available for this account',
          timestamp: getCurrentISOString()
        }, 400);
      }

      try {
        const hashedBackupCodes: string[] = JSON.parse(twoFactorResult.backup_codes);
        const inputCode = code.replace('-', '');

        /* Verify the input code against each hashed backup code */
        let validCodeIndex = -1;
        for (let i = 0; i < hashedBackupCodes.length; i++) {
          const isValid = await verifySecret(inputCode, hashedBackupCodes[i]);
          if (isValid) {
            validCodeIndex = i;
            break;
          }
        }

        if (validCodeIndex !== -1) {
          /* Valid backup code found - remove it from the list */
          isTokenValid = true;
          updatedBackupCodes = hashedBackupCodes.filter((_, index) => index !== validCodeIndex);

          /* Update backup codes immediately after verification */
          await POS_DB_GLOBAL.prepare(UPDATE_BACKUP_CODES_QUERY)
            .bind(
              JSON.stringify(updatedBackupCodes), // updated backup_codes JSON
              user_id                             // user_id for backup codes update
            )
            .run();

          console.log('[2FA-VERIFY] 200: Backup code used and updated', {
            userId: user_id,
            email: userResult.email,
            remainingBackupCodes: updatedBackupCodes.length
          });
        }
      } catch (error) {
        console.log('[2FA-VERIFY] 500: Error parsing backup codes', {
          userId: user_id,
          email: userResult.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        return c.json({
          success: false,
          message: 'INTERNAL_SERVER_ERROR',
          error: 'Error processing backup codes',
          timestamp: getCurrentISOString()
        }, 500);
      }
    }

    if (!isTokenValid) {
      /* Update failed attempts counter */
      const newFailedAttempts = twoFactorResult.failed_attempts + 1;

      await POS_DB_GLOBAL.prepare(UPDATE_2FA_FAILED_ATTEMPTS_QUERY)
        .bind(
          user_id      // user_id for 2FA record update
        )
        .run();

      /* Check if we should lock 2FA after this failed attempt */
      if (should2FABeLocked(newFailedAttempts, twoFactorResult.max_failed_attempts)) {
        const lockExpiration = calculate2FALockExpiration();

        await POS_DB_GLOBAL.prepare(LOCK_2FA_AFTER_MAX_ATTEMPTS_QUERY)
          .bind(
            lockExpiration, // locked_until ISO timestamp
            user_id         // user_id to lock
          )
          .run();

        /* Log 2FA lock activity */
        await logActivity(user_id, null, '2fa_locked', requestInfo, 'success', null);

        console.log('[2FA-VERIFY] 423: 2FA locked after failed verification', {
          userId: user_id,
          email: userResult.email,
          failedAttempts: newFailedAttempts,
          lockedUntil: lockExpiration
        });

        return c.json({
          success: false,
          message: '2FA_LOCKED',
          error: `Two-factor authentication has been locked until ${lockExpiration} due to too many failed attempts`,
          timestamp: getCurrentISOString()
        }, 423);
      }

      /* Log failed 2FA attempt */
      await logActivity(user_id, null, '2fa_verification', requestInfo, 'failure', null);

      const remainingAttempts = twoFactorResult.max_failed_attempts - newFailedAttempts;
      console.log('[2FA-VERIFY] 401: Invalid 2FA token', {
        userId: user_id,
        email: userResult.email,
        remainingAttempts
      });

      return c.json({
        success: false,
        message: 'INVALID_2FA_TOKEN',
        error: `Invalid 2FA token. ${remainingAttempts} attempts remaining.`,
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Reset failed attempts on successful validation */
    await POS_DB_GLOBAL.prepare(RESET_2FA_FAILED_ATTEMPTS_QUERY)
      .bind(
        user_id      // user_id for 2FA record reset
      )
      .run();

    /* Create session and generate tokens */
    const sessionResult = await createSessionAndTokens(userResult, requestInfo, false); // Default session length

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
    const loginResult = await logSuccessfulLogin(userResult.id, sessionId, requestInfo, '2fa_verification');

    /* Check if login operation failed */
    if (!loginResult.success) {
      /* Log error details for debugging */
      console.error("2FA successful login statistics or activity logging error:", {
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

    /* Prepare successful response */
    const loginResponse: LoginResponse = {
      accessToken,
      refreshToken,
      session_id: sessionId,
      requires_2fa: true,
      is_2fa_authenticated: true,
      user: {
        id: userResult.id,
        email: userResult.email,
        name: `${userResult.f_name} ${userResult.l_name}`,
        role: userResult.role_name,
        is_2fa_required: Boolean(userResult.is_2fa_required)
      }
    };

    console.log('[2FA-VERIFY] 200: Successful 2FA verification and login', {
      userId: userResult.id,
      email: userResult.email,
      sessionId
    });

    return c.json({
      success: true,
      data: loginResponse,
      message: 'TWO_FACTOR_VERIFIED',
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during 2FA verification"
    console.error("2FA verification service error:", {
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