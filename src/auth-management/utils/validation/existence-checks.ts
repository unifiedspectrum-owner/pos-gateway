/* Shared module imports */
import { getCurrentISOString } from '@shared/utils/time';
import { isISODateExpired } from '@shared/utils';
import { ValidationResult } from '@shared/types';

/* Auth management module imports */
import { CHECK_USER_EMAIL_EXISTS_QUERY, CHECK_USER_EXISTS_QUERY, GET_ROLE_BY_ID_QUERY } from '@auth-management/queries/authentication';
import { VALIDATE_SESSION_QUERY } from '@auth-management/queries/sessions';

/* Check if user exists with given email */
export const checkUserExistsByEmail = async (email: string, env: Env): Promise<ValidationResult> => {
  try {
    const userResult = await env.POS_DB_GLOBAL.prepare(CHECK_USER_EMAIL_EXISTS_QUERY)
      .bind(email.toLowerCase().trim())
      .first();

    if (!userResult) {
      return {
        isValid: false,
        error: 'User not found'
      };
    }

    return { isValid: true };

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('[USER-VALIDATION] 500: User existence validation service error', {
      error: errorMessage,
      email,
      timestamp: getCurrentISOString()
    });

    return {
      isValid: false,
      error: `Database error while validating email: ${email}. Please try again.`
    };
  }
};

/* Check if session exists and is active for user */
export const checkSessionExists = async (sessionId: string, userId: string, env: Env): Promise<ValidationResult> => {
  try {
    const sessionResult = await env.POS_DB_GLOBAL.prepare(VALIDATE_SESSION_QUERY)
      .bind(sessionId) // session_id for validation
      .first<{ user_id: number; expires_at: string; is_active: number }>();

    if (!sessionResult) {
      return {
        isValid: false,
        error: 'Session does not exist'
      };
    }

    /* Check if session is inactive */
    if (sessionResult.is_active !== 1) {
      return {
        isValid: false,
        error: 'Session has been deactivated'
      };
    }

    /* Check if session is expired */
    if (isISODateExpired(sessionResult.expires_at)) {
      return {
        isValid: false,
        error: 'Session has expired'
      };
    }

    /* Validate session belongs to the token user */
    if (sessionResult.user_id !== parseInt(userId)) {
      return {
        isValid: false,
        error: 'Session does not belong to the authenticated user'
      };
    }

    return { isValid: true };

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('[SESSION-VALIDATION] 500: Session existence validation service error', {
      error: errorMessage,
      sessionId,
      userId,
      timestamp: getCurrentISOString()
    });

    return {
      isValid: false,
      error: `Database error while validating session: ${sessionId}. Please try again.`
    };
  }
};

/* Check if user ID exists in users table */
export const checkUserExists = async (userId: number, env: Env): Promise<ValidationResult> => {
  try {
    /* Query database to verify user existence */
    const userVerification = await env.POS_DB_GLOBAL.prepare(CHECK_USER_EXISTS_QUERY)
      .bind(userId)
      .first();

    if (!userVerification) {
      return {
        isValid: false,
        error: `User with ID ${userId} does not exist or is not active.`
      };
    }

    return { isValid: true };

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('[USER-VALIDATION] 500: User existence validation service error', {
      error: errorMessage,
      userId,
      timestamp: getCurrentISOString()
    });

    return {
      isValid: false,
      error: `Database error while validating user ID: ${userId}. Please try again.`
    };
  }
};

/* Check if role exists and is active */
export const checkRoleExists = async (roleId: number, env: Env): Promise<ValidationResult> => {
  try {
    const role = await env.POS_DB_GLOBAL.prepare(GET_ROLE_BY_ID_QUERY)
      .bind(roleId)
      .first<{id: number}>();

    if (!role) {
      return {
        isValid: false,
        error: `Role with ID ${roleId} does not exist or is not active.`
      };
    }

    return { isValid: true };

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error("Role existence validation service error:", {
      error: errorMessage,
      roleId,
      timestamp: getCurrentISOString()
    });

    return {
      isValid: false,
      error: `Database error while validating role ID: ${roleId}. Please try again.`
    };
  }
};