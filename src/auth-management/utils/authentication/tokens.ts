/* Libraries imports */
import jwt from 'jsonwebtoken';

/* Shared module imports */
import { configService } from '@shared/services';
import { getCurrentUnixTimestamp, addHoursToCurrentTime, addDaysToCurrentTime } from '@shared/utils';
import { isJWTTokenExpired } from '@shared/utils';
import type { JWTPayload } from '@shared/middleware';

/* Auth management module imports */
import { ACCESS_TOKEN_EXPIRATION_HOURS, REFRESH_TOKEN_EXPIRATION_DAYS } from '@auth-management/constants';
import { POS_API_BASE_URL } from '@shared/constants';

/* Token verification result interface */
export interface TokenVerificationResult {
  success: boolean;
  error?: string;
  payload?: JWTPayload;
}

/* Generate JWT access token */
export const generateAccessToken = async (payloadData: Omit<JWTPayload, 'iss' | 'iat' | 'exp'>): Promise<string> => {
  const jwtSecret = await configService.getJwtAuthSecret();

  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  const payload: JWTPayload = {
    ...payloadData,
    iss: POS_API_BASE_URL,
    iat: getCurrentUnixTimestamp(),
    exp: addHoursToCurrentTime(ACCESS_TOKEN_EXPIRATION_HOURS) // Access token expiration from constants
  };

  return jwt.sign(payload, jwtSecret);
};

/* Generate JWT refresh token */
export const generateRefreshToken = async (payloadData: Omit<JWTPayload, 'iss' | 'iat' | 'exp'>): Promise<string> => {
  const jwtSecret = await configService.getJwtAuthSecret();

  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  const payload: JWTPayload = {
    ...payloadData,
    iss: POS_API_BASE_URL,
    iat: getCurrentUnixTimestamp(),
    exp: addDaysToCurrentTime(REFRESH_TOKEN_EXPIRATION_DAYS) // Refresh token expiration from constants
  };

  return jwt.sign(payload, jwtSecret);
};

/* Verify refresh token JWT signature and expiration */
export const verifyRefreshToken = async (refreshToken: string): Promise<TokenVerificationResult> => {
  try {
    /* Get JWT secret from ConfigService with caching */
    const jwtSecret = await configService.getJwtAuthSecret();

    if (!jwtSecret) {
      return {
        success: false,
        error: 'Authentication configuration is missing'
      };
    }

    /* Verify JWT signature and decode payload */
    const decodedToken = jwt.verify(refreshToken, jwtSecret) as JWTPayload;

    /* Validate required JWT payload fields */
    if (!decodedToken.sub || !decodedToken.user_name || !decodedToken.role_id || !decodedToken.session_id) {
      return {
        success: false,
        error: 'Refresh token is missing required user information'
      };
    }

    /* Check if token is expired (additional validation) */
    if (isJWTTokenExpired(decodedToken.exp)) {
      return {
        success: false,
        error: 'Refresh token has expired'
      };
    }

    /* Return successful verification result */
    return {
      success: true,
      payload: decodedToken
    };

  } catch (jwtError) {
    /* Handle JWT verification errors */
    let errorMessage = "Invalid refresh token";

    if (jwtError instanceof jwt.TokenExpiredError) {
      errorMessage = "Refresh token has expired";
    } else if (jwtError instanceof jwt.JsonWebTokenError) {
      errorMessage = "Refresh token is malformed or invalid";
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};
