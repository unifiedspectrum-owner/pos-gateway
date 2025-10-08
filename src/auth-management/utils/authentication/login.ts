/* Shared module imports */
import { JWTPayload } from "@shared/middleware";

/* Auth management module imports */
import { CHECK_LOGIN_STATS_EXISTS_QUERY, INSERT_LOGIN_STATS_QUERY, INSERT_LOGIN_STATS_FAILED_QUERY, UPDATE_LOGIN_STATS_SUCCESS_QUERY, UPDATE_LOGIN_STATS_FAILED_QUERY, LOG_USER_ACTIVITY_QUERY, CREATE_SESSION_QUERY } from "@auth-management/queries";
import { generateSessionId, generateAccessToken, generateRefreshToken, calculateSessionExpiration, ClientRequestInfo } from "@auth-management/utils";
import type { UserWithRole } from "@auth-management/types";

/* Interface for login statistics and activity logging result */
export interface LoginOperationResult {
  success: boolean;
  statsSuccess?: boolean;
  activitySuccess?: boolean;
  statsError?: string;
  activityError?: string;
}

/* Log successful login with statistics update and activity logging */
export const logSuccessfulLogin = async (
  env: Env,
  userId: number,
  sessionId: string,
  requestInfo: ClientRequestInfo,
  actionType: 'user_login' | '2fa_verification' = 'user_login'
): Promise<LoginOperationResult> => {
  try {

    /* Check if login statistics record exists */
    const existsResult = await env.POS_DB_GLOBAL.prepare(CHECK_LOGIN_STATS_EXISTS_QUERY)
      .bind(userId)
      .first();

    let statsResult;

    if (!existsResult) {
      /* Insert new login statistics record */
      statsResult = await env.POS_DB_GLOBAL.prepare(INSERT_LOGIN_STATS_QUERY)
        .bind(
          userId,                 // user_id
          requestInfo.ip_address, // last_login_ip
          requestInfo.user_agent, // last_user_agent
          null                    // last_device_fingerprint
        )
        .run();
    } else {
      /* Update existing login statistics */
      statsResult = await env.POS_DB_GLOBAL.prepare(UPDATE_LOGIN_STATS_SUCCESS_QUERY)
        .bind(
          requestInfo.ip_address, // last_login_ip
          requestInfo.user_agent, // last_user_agent
          null,                   // last_device_fingerprint
          userId                  // user_id
        )
        .run();
    }

    /* Log activity */
    const activityResult = await env.POS_DB_GLOBAL.prepare(LOG_USER_ACTIVITY_QUERY)
      .bind(
        userId,                 // user_id for activity log
        sessionId,              // session_id for successful login
        actionType,             // action_type
        requestInfo.ip_address, // ip_address
        requestInfo.user_agent, // user_agent
        null,                   // device_fingerprint
        'success',              // action_result
        null                    // performed_by (null for self-action)
      )
      .run();

    const statsSuccess = statsResult.success;
    const activitySuccess = activityResult.success;

    return {
      success: statsSuccess && activitySuccess,
      statsSuccess,
      activitySuccess,
      statsError: !statsSuccess ? String(statsResult.error) : undefined,
      activityError: !activitySuccess ? String(activityResult.error) : undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in login operations';
    return {
      success: false,
      statsSuccess: false,
      activitySuccess: false,
      statsError: errorMessage,
      activityError: errorMessage
    };
  }
};

/* Log failed login attempt with statistics update and activity logging */
export const logFailedLogin = async (
  env: Env,
  userId: number,
  requestInfo: ClientRequestInfo,
  actionType: 'user_login' | '2fa_verification' = 'user_login',
): Promise<LoginOperationResult> => {
  try {
    
    /* Check if login statistics record exists */
    const existsResult = await env.POS_DB_GLOBAL.prepare(CHECK_LOGIN_STATS_EXISTS_QUERY)
      .bind(userId)
      .first();

    let statsResult;

    if (!existsResult) {
      /* Insert new login statistics record for failed first login */
      statsResult = await env.POS_DB_GLOBAL.prepare(INSERT_LOGIN_STATS_FAILED_QUERY)
        .bind(
          userId,                 // user_id
          requestInfo.ip_address // last_failed_login_ip
        )
        .run();
    } else {
      /* Update existing login statistics for failed attempt */
      statsResult = await env.POS_DB_GLOBAL.prepare(UPDATE_LOGIN_STATS_FAILED_QUERY)
        .bind(
          requestInfo.ip_address, // last_failed_login_ip
          userId                  // user_id
        )
        .run();
    }

    /* Log activity */
    const activityResult = await env.POS_DB_GLOBAL.prepare(LOG_USER_ACTIVITY_QUERY)
      .bind(
        userId,                 // user_id for activity log
        null,                   // session_id (null for failed login)
        actionType,             // action_type
        requestInfo.ip_address, // ip_address
        requestInfo.user_agent, // user_agent
        null,                   // device_fingerprint
        'failure',              // action_result
        null                    // performed_by (null for self-action)
      )
      .run();

    const statsSuccess = statsResult.success;
    const activitySuccess = activityResult.success;

    return {
      success: statsSuccess && activitySuccess,
      statsSuccess,
      activitySuccess,
      statsError: !statsSuccess ? String(statsResult.error) : undefined,
      activityError: !activitySuccess ? String(activityResult.error) : undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in failed login operations';
    return {
      success: false,
      statsSuccess: false,
      activitySuccess: false,
      statsError: errorMessage,
      activityError: errorMessage
    };
  }
};

/* Log specific activity without statistics update */
export const logActivity = async (
  env: Env,
  userId: string,
  sessionId: string | null,
  actionType: string,
  requestInfo: ClientRequestInfo,
  actionResult: 'success' | 'failure' = 'success',
  performedBy: number | null = null,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await env.POS_DB_GLOBAL.prepare(LOG_USER_ACTIVITY_QUERY)
      .bind(
        userId,        // user_id for activity log
        sessionId,     // session_id (can be null)
        actionType,    // action_type
        requestInfo.ip_address, // ip_address
        requestInfo.user_agent, // user_agent
        null,          // device_fingerprint
        actionResult,  // action_result
        performedBy    // performed_by (null for self/system action)
      )
      .run();

    return {
      success: result.success,
      error: !result.success ? String(result.error) : undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in activity logging';
    return {
      success: false,
      error: errorMessage
    };
  }
};

/* Create JWT payload from user data */
export const createJWTPayload = (user: UserWithRole, sessionId: string): Omit<JWTPayload, 'iss' | 'iat' | 'exp'> => {
  return {
    sub: user.id.toString(),
    user_name: user.email,
    name: `${user.f_name} ${user.l_name}`,
    role_id: user.role_id,
    role_name: user.role_name,
    session_id: sessionId,
  };
};

/* Create user session and generate tokens */
export const createSessionAndTokens = async (
  env: Env,
  user: UserWithRole,
  requestInfo: ClientRequestInfo,
  rememberMe: boolean = false,
): Promise<{
  success: boolean;
  sessionId?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}> => {
  try {
    /* Generate session and tokens */
    const sessionId = generateSessionId();
    const sessionExpiration = calculateSessionExpiration(rememberMe);

    /* Create user session */
    const sessionResult = await env.POS_DB_GLOBAL.prepare(CREATE_SESSION_QUERY)
      .bind(
        sessionId, // unique session identifier
        user.id, // user_id for session ownership
        requestInfo.ip_address, // client ip_address
        requestInfo.user_agent, // client user_agent
        null, // device_fingerprint for security
        sessionExpiration.toISOString() // session expires_at timestamp
      )
      .run();

    if (!sessionResult.success) {
      return {
        success: false,
        error: String(sessionResult.error)
      };
    }

    /* Create JWT payload */
    const payload = createJWTPayload(user, sessionId);

    /* Generate JWT tokens */
    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(payload),
      generateRefreshToken(payload)
    ]);

    return {
      success: true,
      sessionId,
      accessToken,
      refreshToken
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in session and token creation';
    return {
      success: false,
      error: errorMessage
    };
  }
};

