/* Libraries imports */
import { authenticator } from "otplib";

/* Shared module imports */
import { getCurrentISOString } from "@shared/utils";
import { validatePayload } from "@shared/utils/validation";
import { POS_DB_GLOBAL, USER_CONTEXT_KEY } from "@shared/constants";
import type { AuthenticatedContext } from "@shared/middleware";

/* Auth management module imports */
import { GET_USER_2FA_SECRET_QUERY, ENABLE_2FA_QUERY, GET_USER_BY_ID_QUERY } from "@auth-management/queries";
import { TwoFactorAuthData, UserWithRole } from "@auth-management/types";
import { enable2FASchema } from "@auth-management/schemas";
import { sendUser2FASetupEmail } from "@auth-management/utils";

/* Verify OTP and enable 2FA service for authenticated users */
export const enable2FA = async (c: AuthenticatedContext) => {
  try {
    /* Get authenticated user from middleware context */
    const authenticatedUser = c.get(USER_CONTEXT_KEY);

    /* Parse and validate request body */
    const rawBody = await c.req.json();

    /* Validate request payload against enable 2FA schema */
    const validationResult = validatePayload(rawBody, enable2FASchema, 'enable 2FA');

    if (!validationResult.isValid || !validationResult.data) {
      return c.json({
        success: false,
        message: "VALIDATION_ERROR",
        error: validationResult.message,
        validation_errors: validationResult.errors,
        timestamp: getCurrentISOString()
      }, 400);
    }

    const { code } = validationResult.data;

    /* Get user details */
    const userDetails = await POS_DB_GLOBAL.prepare(GET_USER_BY_ID_QUERY)
      .bind(authenticatedUser.id)
      .first<UserWithRole>();

    if (!userDetails) {
      return c.json({
        success: false,
        message: "USER_NOT_FOUND",
        error: "User not found or inactive",
        timestamp: getCurrentISOString()
      }, 404);
    }

    /* Check if 2FA is already enabled */
    if (Boolean(userDetails.is_2fa_enabled)) {
      return c.json({
        success: false,
        message: "2FA_ALREADY_ENABLED",
        error: "Two-factor authentication is already enabled for this account",
        timestamp: getCurrentISOString()
      }, 409);
    }

    /* Get 2FA configuration */
    const twoFactorRecord = await POS_DB_GLOBAL.prepare(GET_USER_2FA_SECRET_QUERY)
      .bind(authenticatedUser.id)
      .first<TwoFactorAuthData>();

    if (!twoFactorRecord || !twoFactorRecord.secret) {
      return c.json({
        success: false,
        message: "2FA_NOT_INITIALIZED",
        error: "2FA credentials not found. Please generate 2FA credentials first",
        timestamp: getCurrentISOString()
      }, 404);
    }

    /* Verify TOTP code with authenticator */
    const isValidToken = authenticator.verify({
      token: code,
      secret: twoFactorRecord.secret
    });

    if (!isValidToken) {
      /* Service operation with invalid token */
      console.log('[2FA-ENABLE] 401: Invalid TOTP code', {
        userId: authenticatedUser.id,
        email: authenticatedUser.user_name
      });

      return c.json({
        success: false,
        message: "INVALID_2FA_TOKEN",
        error: "Invalid TOTP code. Please check your authenticator app and try again",
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Enable 2FA flag in users table */
    const enableResult = await POS_DB_GLOBAL.prepare(ENABLE_2FA_QUERY)
      .bind(authenticatedUser.id)
      .run();

    if (!enableResult.success) {
      /* Log error details for debugging */
      console.error("2FA enable error:", {
        error: "Failed to enable 2FA flag for user",
        userId: authenticatedUser.id,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: "2FA_ENABLE_ERROR",
        error: "Failed to enable 2FA for user account",
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Send 2FA setup email notification */
    if (userDetails) {
      const emailResult = await sendUser2FASetupEmail({
        to: userDetails.email,
        firstName: userDetails.f_name,
        lastName: userDetails.l_name,
        email: userDetails.email,
        roleName: userDetails.role_name || 'Unknown Role'
      });

      if (!emailResult.success) {
        /* Log error but don't fail the request - 2FA was already enabled successfully */
        console.error("2FA setup email error:", {
          error: emailResult.error,
          userId: authenticatedUser.id,
          email: userDetails.email,
          timestamp: getCurrentISOString()
        });
      }
    }

    /* Service operation successful */
    console.log('[2FA-ENABLE] 200: Successful 2FA enablement', {
      userId: authenticatedUser.id,
      email: authenticatedUser.user_name,
      emailSent: !!userDetails
    });

    /* Return success response */
    return c.json({
      success: true,
      message: "2FA_ENABLED_SUCCESSFULLY",
      data: {
        user_id: authenticatedUser.id,
        enabled_at: getCurrentISOString()
      },
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while enabling 2FA";
    console.error("Enable 2FA service error:", {
      error: errorMessage,
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: "INTERNAL_SERVER_ERROR",
      error: errorMessage,
      timestamp: getCurrentISOString()
    }, 500);
  }
};