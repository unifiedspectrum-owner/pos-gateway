/* Shared module imports */
import { getCurrentISOString } from "@shared/utils";
import { USER_CONTEXT_KEY, POS_DB_GLOBAL } from "@shared/constants";
import type { AuthenticatedContext } from "@shared/middleware";

/* Auth management module imports */
import { DISABLE_2FA_QUERY, DELETE_USER_2FA_QUERY, GET_USER_BY_ID_QUERY } from "@auth-management/queries";
import { UserWithRole } from "@auth-management/types";
import { sendUser2FADisabledEmail } from "@auth-management/utils";

/* Disable 2FA service for authenticated users */
export const disable2FA = async (c: AuthenticatedContext) => {
  try {
    /* Get authenticated user from middleware context */
    const authenticatedUser = c.get(USER_CONTEXT_KEY);

    /* Get user details and check if 2FA is currently enabled */
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

    if (!Boolean(userDetails.is_2fa_enabled)) {
      return c.json({
        success: false,
        message: "2FA_ALREADY_DISABLED",
        error: "Two-factor authentication is already disabled for this account",
        timestamp: getCurrentISOString()
      }, 409);
    }

    /* Disable 2FA flag in users table */
    const disableResult = await POS_DB_GLOBAL.prepare(DISABLE_2FA_QUERY)
      .bind(authenticatedUser.id)
      .run();

    if (!disableResult.success) {
      /* Log error details for debugging */
      console.error("2FA disable error:", {
        error: "Failed to disable 2FA flag for user",
        userId: authenticatedUser.id,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: "2FA_DISABLE_ERROR",
        error: "Failed to disable 2FA for user account",
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Delete 2FA configuration data */
    const deleteResult = await POS_DB_GLOBAL.prepare(DELETE_USER_2FA_QUERY)
      .bind(authenticatedUser.id)
      .run();

    if (!deleteResult.success) {
      /* Log error details for debugging */
      console.error("2FA data deletion error:", {
        error: "Failed to delete 2FA data for user",
        userId: authenticatedUser.id,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: "2FA_DATA_DELETION_ERROR",
        error: "Failed to remove 2FA configuration data",
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Send 2FA disabled email notification */
    try {
      const emailResult = await sendUser2FADisabledEmail({
        to: userDetails.email,
        firstName: userDetails.f_name,
        lastName: userDetails.l_name,
        email: userDetails.email,
        roleName: userDetails.role_name || 'Unknown Role'
      });

      if (!emailResult.success) {
        /* Log email error details for debugging */
        console.error("2FA disabled email sending failed:", {
          error: emailResult.error,
          userId: authenticatedUser.id,
          email: userDetails.email,
          timestamp: getCurrentISOString()
        });
      }
    } catch (emailError) {
      /* Log error details for debugging */
      console.error("2FA disabled email service error:", {
        error: emailError instanceof Error ? emailError.message : 'Unknown email error',
        userId: authenticatedUser.id,
        timestamp: getCurrentISOString()
      });
    }

    /* Service operation successful */
    console.log('[2FA-DISABLE] 200: Successful 2FA disable', {
      userId: authenticatedUser.id,
      email: authenticatedUser.user_name,
      emailSent: !!userDetails
    });

    return c.json({
      success: true,
      data: {
        is_2fa_enabled: false,
      },
      message: "2FA_DISABLED_SUCCESSFULLY",
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while disabling 2FA";
    console.error("2FA disable service error:", {
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