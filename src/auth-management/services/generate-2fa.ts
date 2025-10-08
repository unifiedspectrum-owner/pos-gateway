/* Libraries imports */
import { authenticator } from "otplib";

/* Shared module imports */
import { getCurrentISOString } from "@shared/utils";
import { DEFAULT_2FA_MAX_FAILED_ATTEMPTS, USER_CONTEXT_KEY } from "@shared/constants";
import type { AuthenticatedContext } from "@shared/middleware";

/* Auth management module imports */
import { generateBackupCodes, formatBackupCodesForDisplay, hashSecret } from "@auth-management/utils";
import { INITIALIZE_USER_2FA_QUERY, GET_USER_BY_ID_QUERY } from "@auth-management/queries";
import { UserWithRole } from "@auth-management/types";

/* User management module imports */
import { CHECK_USER_2FA_EXISTS_QUERY, REACTIVATE_USER_2FA_QUERY } from "@auth-management/queries";

/* Generate 2FA credentials for authenticated users */
export const generate2FA = async (c: AuthenticatedContext) => {
  try {
    /* Get authenticated user from middleware context */
    const authenticatedUser = c.get(USER_CONTEXT_KEY);

    /* Get user details and check if 2FA is already enabled */
    const userDetails = await c.env.POS_DB_GLOBAL.prepare(GET_USER_BY_ID_QUERY)
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

    if (Boolean(userDetails.is_2fa_enabled)) {
      return c.json({
        success: false,
        message: "2FA_ALREADY_ENABLED",
        error: "Two-factor authentication is already enabled for this account",
        timestamp: getCurrentISOString()
      }, 409);
    }

    /* Generate 2FA secret */
    const twoFactorSecret = authenticator.generateSecret();
    const currentTime = getCurrentISOString();

    /* Generate backup codes */
    const backupCodes = generateBackupCodes(10);

    /* Hash backup codes for secure storage */
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => hashSecret(code))
    );
    const hashedBackupCodesJson = JSON.stringify(hashedBackupCodes);

    /* Generate QR code URL */
    const qrCodeUrl = authenticator.keyuri(
      authenticatedUser.user_name,
      'POS-SaaS-Platform',
      twoFactorSecret
    );

    /* Check if user already has a 2FA record */
    const existing2FARecord = await c.env.POS_DB_GLOBAL.prepare(CHECK_USER_2FA_EXISTS_QUERY)
      .bind(authenticatedUser.id)
      .first<{id: number, is_active: number}>();

    let twoFactorResult;

    if (existing2FARecord) {
      /* Update existing 2FA record (pending verification) */
      twoFactorResult = await c.env.POS_DB_GLOBAL.prepare(REACTIVATE_USER_2FA_QUERY)
        .bind(
          twoFactorSecret, // secret
          hashedBackupCodesJson, // backup_codes (JSON string)
          currentTime, // backup_codes_generated_at
          DEFAULT_2FA_MAX_FAILED_ATTEMPTS, // max_failed_attempts
          currentTime, // updated_at
          authenticatedUser.id // user_id
        )
        .run();
    } else {
      /* Initialize new 2FA record (pending verification) */
      twoFactorResult = await c.env.POS_DB_GLOBAL.prepare(INITIALIZE_USER_2FA_QUERY)
        .bind(
          authenticatedUser.id, // user_id
          twoFactorSecret, // secret (plain text for TOTP verification)
          hashedBackupCodesJson, // backup_codes (JSON string of hashed codes)
          currentTime, // backup_codes_generated_at
          DEFAULT_2FA_MAX_FAILED_ATTEMPTS // max_failed_attempts
        )
        .run();
    }

    if (!twoFactorResult.success) {
      /* Log error details for debugging */
      console.error("2FA credentials generation error:", {
        error: "Failed to generate 2FA credentials for user",
        userId: authenticatedUser.id,
        isExistingRecord: !!existing2FARecord,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: "2FA_SETUP_ERROR",
        error: "Failed to generate 2FA credentials for user account",
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Service operation successful */
    console.log('[2FA-GENERATE] 200: Successful 2FA credentials generation', {
      userId: authenticatedUser.id,
      email: authenticatedUser.user_name,
      isExistingRecord: !!existing2FARecord
    });

    return c.json({
      success: true,
      data: {
        secret: twoFactorSecret,
        qr_code_url: qrCodeUrl,
        backup_codes: JSON.stringify(formatBackupCodesForDisplay(backupCodes))
      },
      message: "2FA_CREDENTIALS_GENERATED",
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while generating 2FA credentials";
    console.error("2FA generation service error:", {
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