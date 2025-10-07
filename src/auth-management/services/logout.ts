/* Shared module imports */
import { POS_DB_GLOBAL, USER_CONTEXT_KEY } from "@shared/constants";
import { getCurrentISOString } from "@shared/utils";
import { AuthenticatedContext } from "@shared/middleware";

/* Auth management module imports */
import {
  DEACTIVATE_SESSION_QUERY,
  DECREMENT_ACTIVE_SESSIONS_QUERY,
  LOG_USER_ACTIVITY_QUERY
} from "@auth-management/queries";
import { extractRequestInfo } from "@auth-management/utils";

/* User logout service with session cleanup and activity logging */
export const logout = async (c: AuthenticatedContext) => {
  try {
    const user = c.get(USER_CONTEXT_KEY);
    const requestInfo = extractRequestInfo(c);

    /* Use session ID from JWT token or request body */
    const sessionId = user.session_id;

    /* Deactivate specific session */
    const sessionResult = await POS_DB_GLOBAL.prepare(DEACTIVATE_SESSION_QUERY)
      .bind(
        sessionId,   // session_id to deactivate
        user.id      // user_id for ownership verification
      )
      .run();

    if (!sessionResult.success) {
      /* Log error details for debugging */
      console.error('[USER-LOGOUT] 500: Session deactivation service error', {
        error: sessionResult.error,
        sessionId,
        userId: user.id,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: 'SESSION_DEACTIVATION_FAILED',
        error: 'Failed to deactivate session. Please try again.',
        timestamp: getCurrentISOString()
      }, 500);
    }

    /* Run decrement sessions and activity logging in parallel */
    const [decrementResult, activityResult] = await Promise.all([
      /* Decrement active sessions count */
      POS_DB_GLOBAL.prepare(DECREMENT_ACTIVE_SESSIONS_QUERY)
        .bind(user.id) // user_id to decrement active sessions
        .run(),

      /* Log logout activity */
      POS_DB_GLOBAL.prepare(LOG_USER_ACTIVITY_QUERY)
        .bind(
          user.id, // user_id for activity log
          sessionId, // session_id for logout activity
          'user_logout', // action_type
          requestInfo.ip_address, // ip_address
          requestInfo.user_agent, // user_agent
          null, // device_fingerprint
          'success', // action_result
          null // performed_by (null for self-action)
        )
        .run()
    ]);

    if (!decrementResult.success) {
      /* Log error details for debugging */
      console.error('[USER-LOGOUT] 500: Decrement active sessions service error', {
        error: decrementResult.error,
        sessionId,
        userId: user.id,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: 'DECREMENT_SESSIONS_FAILED',
        error: 'Session was deactivated but failed to update session count. Please contact support.',
        timestamp: getCurrentISOString()
      }, 500);
    }

    if (!activityResult.success) {
      /* Log error details for debugging */
      console.error('[USER-LOGOUT] 500: Activity logging service error', {
        error: activityResult.error,
        sessionId,
        userId: user.id,
        timestamp: getCurrentISOString()
      });

      return c.json({
        success: false,
        message: 'ACTIVITY_LOGGING_FAILED',
        error: 'Session was deactivated but failed to log activity. Please contact support.',
        timestamp: getCurrentISOString()
      }, 500);
    }

    return c.json({
      success: true,
      message: 'LOGOUT_SUCCESSFUL',
      data: {
        logged_out_at: getCurrentISOString(),
        session_id: sessionId
      },
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[USER-LOGOUT] 500: User logout service error', {
      error: errorMessage,
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: 'INTERNAL_SERVER_ERROR',
      error: 'An unexpected error occurred during logout. Please try again.',
      timestamp: getCurrentISOString()
    }, 500);
  }
};