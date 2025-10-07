/* Libraries imports */
import { Context, Next } from "hono";
import jwt from 'jsonwebtoken';

/* Shared module imports */
import { getCurrentISOString } from "@shared/utils";
import { isJWTTokenExpired, isISODateExpired } from "@shared/utils";
import { configService } from "@shared/services";
import { POS_DB_GLOBAL, USER_CONTEXT_KEY } from "@shared/constants";

/* Auth module imports */
import { VALIDATE_SESSION_QUERY } from "@auth-management/queries";
import { checkUserExists } from "@auth-management/utils/validation";

/* JWT payload interface for type safety */
export interface JWTPayload {
  iss: string;
  sub: string;
  user_name: string;
  name: string;
  role_id: number;
  role_name: string;
  session_id: string;
  iat: number;
  exp: number;
}

/* Authenticated user context interface */
export interface AuthenticatedUser {
  id: string;
  name: string;
  user_name: string;
  role_id: number;
  role_name: string;
  session_id: string;
}

/* Context type with user information */
export type AuthenticatedContext = Context<{
  Bindings: Env;
  Variables: {
    user: AuthenticatedUser;
  };
}>;

/* JWT authentication middleware for validating Bearer tokens */
export const jwtAuthMiddleware = async (c: Context<{Bindings: Env; Variables: {user: AuthenticatedUser}}>, next: Next) => {
  try {
    /* Extract Authorization header */
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      console.log('[JWT-AUTH] 401: Missing Authorization header');
      return c.json({
        success: false,
        message: "AUTHORIZATION_REQUIRED",
        error: "Authorization header is required",
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Validate Bearer token format */
    if (!authHeader.startsWith('Bearer ')) {
      console.log('[JWT-AUTH] 401: Invalid token format - missing Bearer prefix');
      return c.json({
        success: false,
        message: "INVALID_TOKEN_FORMAT",
        error: "Authorization header must start with 'Bearer '",
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Extract JWT token from Bearer header */
    const token = authHeader.substring(7);

    if (!token) {
      console.log('[JWT-AUTH] 401: JWT token is empty after Bearer prefix');
      return c.json({
        success: false,
        message: "TOKEN_MISSING",
        error: "JWT token is missing from Authorization header",
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Verify and decode JWT token */
    let decodedToken: JWTPayload;

    try {
      /* Get JWT secret from ConfigService with caching */
      const jwtSecret = await configService.getJwtAuthSecret();

      if (!jwtSecret) {
        /* Log error details for debugging */
        console.error("[JWT-AUTH] 500: JWT_SECRET environment variable not configured", {
          error: "JWT_SECRET environment variable not configured",
          timestamp: getCurrentISOString()
        });

        return c.json({
          success: false,
          message: "CONFIGURATION_ERROR",
          error: "Authentication configuration is missing",
          timestamp: getCurrentISOString()
        }, 500);
      }

      /* Verify JWT signature and decode payload */
      decodedToken = jwt.verify(token, jwtSecret) as JWTPayload;

    } catch (jwtError) {
      /* Handle JWT verification errors */
      let errorMessage = "Invalid JWT token";

      if (jwtError instanceof jwt.TokenExpiredError) {
        errorMessage = "JWT token has expired";
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        errorMessage = "JWT token is malformed or invalid";
      }

      console.log(`[JWT-AUTH] 401: ${errorMessage}`, { tokenPreview: token.substring(0, 20) + '...' });
      return c.json({
        success: false,
        message: "TOKEN_INVALID",
        error: errorMessage,
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Validate required JWT payload fields */
    if (!decodedToken.sub || !decodedToken.user_name || !decodedToken.role_id) {
      console.log('[JWT-AUTH] 401: JWT token missing required payload fields', {
        hasSub: !!decodedToken.sub,
        hasUserName: !!decodedToken.user_name,
        hasRoleId: !!decodedToken.role_id
      });
      return c.json({
        success: false,
        message: "INVALID_TOKEN_PAYLOAD",
        error: "JWT token is missing required user information",
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Check if token is expired (additional validation) */
    if (isJWTTokenExpired(decodedToken.exp)) {
      console.log('[JWT-AUTH] 401: JWT token has expired', {
        userId: decodedToken.sub,
        expiration: decodedToken.exp,
        sessionId: decodedToken.session_id
      });
      return c.json({
        success: false,
        message: "TOKEN_EXPIRED",
        error: "JWT token has expired",
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Validate user existence and active status */
    const userValidation = await checkUserExists(parseInt(decodedToken.sub));
    if (!userValidation.isValid) {
      console.log('[JWT-AUTH] 401: User does not exist or is inactive', {
        userId: decodedToken.sub,
        sessionId: decodedToken.session_id,
        error: userValidation.error
      });
      return c.json({
        success: false,
        message: "USER_NOT_FOUND",
        error: userValidation.error || "User does not exist or is inactive",
        timestamp: getCurrentISOString()
      }, 401);
    }

    /* Validate session existence and status */
    if (decodedToken.session_id) {
      try {
        const sessionResult = await POS_DB_GLOBAL.prepare(VALIDATE_SESSION_QUERY)
          .bind(decodedToken.session_id)
          .first<{user_id: string, expires_at: string, is_active: number}>();

        if (!sessionResult) {
          console.log('[JWT-AUTH] 401: Session not found', {
            userId: decodedToken.sub,
            sessionId: decodedToken.session_id
          });
          return c.json({
            success: false,
            message: "SESSION_NOT_FOUND",
            error: "Session does not exist or has been terminated",
            timestamp: getCurrentISOString()
          }, 401);
        }

        /* Check if session is active */
        if (!Boolean(sessionResult.is_active)) {
          console.log('[JWT-AUTH] 401: Session is inactive', {
            userId: decodedToken.sub,
            sessionId: decodedToken.session_id,
            isActive: sessionResult.is_active
          });
          return c.json({
            success: false,
            message: "SESSION_INACTIVE",
            error: "Session has been deactivated",
            timestamp: getCurrentISOString()
          }, 401);
        }

        /* Check if session belongs to the token user */
        if (sessionResult.user_id.toString() !== decodedToken.sub.toString()) {
          console.log('[JWT-AUTH] 401: Session user mismatch', {
            tokenUserId: decodedToken.sub,
            sessionUserId: sessionResult.user_id,
            sessionId: decodedToken.session_id
          });
          return c.json({
            success: false,
            message: "SESSION_USER_MISMATCH",
            error: "Session does not belong to the authenticated user",
            timestamp: getCurrentISOString()
          }, 401);
        }

        /* Check if session has expired */
        if (isISODateExpired(sessionResult.expires_at)) {
          console.log('[JWT-AUTH] 401: Session has expired', {
            userId: decodedToken.sub,
            sessionId: decodedToken.session_id,
            expiresAt: sessionResult.expires_at
          });
          return c.json({
            success: false,
            message: "SESSION_EXPIRED",
            error: "Session has expired",
            timestamp: getCurrentISOString()
          }, 401);
        }

      } catch (sessionError) {
        /* Log error details for debugging */
        console.error("[JWT-AUTH] 500: Session validation error", {
          error: sessionError instanceof Error ? sessionError.message : 'Unknown session validation error',
          sessionId: decodedToken.session_id,
          userId: decodedToken.sub,
          timestamp: getCurrentISOString()
        });

        return c.json({
          success: false,
          message: "SESSION_VALIDATION_ERROR",
          error: "Failed to validate session",
          timestamp: getCurrentISOString()
        }, 500);
      }
    }

    /* Add user information to context for use in route handlers */
    c.set(USER_CONTEXT_KEY, {
      id: decodedToken.sub,
      user_name: decodedToken.user_name,
      name: decodedToken.name,
      role_id: decodedToken.role_id,
      role_name: decodedToken.role_name,
      session_id: decodedToken.session_id
    });

    /* Continue to next middleware/handler */
    await next();

  } catch (error) {
    /* Log error details for debugging */
    console.error("[JWT-AUTH] 500: JWT authentication middleware error", {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: getCurrentISOString()
    });

    return c.json({
      success: false,
      message: "AUTHENTICATION_ERROR",
      error: "An error occurred during authentication",
      timestamp: getCurrentISOString()
    }, 500);
  }
};