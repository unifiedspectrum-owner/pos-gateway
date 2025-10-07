/* Shared module imports */
import { POS_DB_GLOBAL, USER_CONTEXT_KEY } from "@shared/constants";
import { getCurrentISOString } from "@shared/utils";
import type { AuthenticatedContext, JWTPayload } from "@shared/middleware";

/* Auth management module imports */
import { UPDATE_SESSION_ACTIVITY_QUERY } from "@auth-management/queries";
import { generateAccessToken } from "@auth-management/utils";

/* Refresh token service for generating new access tokens using middleware authentication */
export const refreshToken = async (c: AuthenticatedContext) => {
  try {
    /* Get authenticated user from middleware context */
    const authenticatedUser = c.get(USER_CONTEXT_KEY);

    /* Update session last activity */
    await POS_DB_GLOBAL.prepare(UPDATE_SESSION_ACTIVITY_QUERY)
      .bind(authenticatedUser.session_id)
      .run();

    /* Generate new tokens using fresh user data */
    const tokenPayload: Omit<JWTPayload, 'iss' | 'iat' | 'exp'> = {
      sub: authenticatedUser.id,
      user_name: authenticatedUser.user_name,
      name: authenticatedUser.name,
      role_id: authenticatedUser.role_id,
      role_name: authenticatedUser.role_name,
      session_id: authenticatedUser.session_id,
    };

    /* Generate new access token and refresh token */
    const newAccessToken = await generateAccessToken(tokenPayload);

    /* Service operation successful */
    console.log('[TOKEN-REFRESH] 200: Successful token refresh', {
      userId: authenticatedUser.id,
      email: authenticatedUser.user_name,
      sessionId: authenticatedUser.session_id
    });

    return c.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
      message: 'TOKEN_REFRESHED_SUCCESSFULLY',
      timestamp: getCurrentISOString()
    }, 200);

  } catch (error) {
    /* Log error details for debugging */
    console.error("Token refresh service error:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: 'INTERNAL_SERVER_ERROR',
      error: 'An unexpected error occurred during token refresh. Please try again.',
      timestamp: getCurrentISOString()
    }, 500);
  }
};