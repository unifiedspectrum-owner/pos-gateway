/* Libraries imports */
import jwt from 'jsonwebtoken';

/* Shared module imports */
import { POS_GATEWAY_BASE_URL, POS_API_BASE_URL, GATEWAY_TOKEN_EXPIRATION_MINUTES } from '@shared/constants';
import { getCurrentUnixTimestamp, getCurrentISOString, addMinutesToCurrentTime } from '@shared/utils';
import { configService } from '@shared/services';

/* Gateway JWT payload interface */
interface GatewayJWTPayload {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

/* Generate gateway JWT token for API Gateway to POS Backend authentication */
export const generateGatewayToken = async (userId: string) => {
  try {
    const jwtSecret = await configService.getJwtGatewaySecret();

    if (!jwtSecret) {
      throw new Error('Gateway JWT secret not configured');
    }

    /* Create gateway JWT payload with authenticated user context */
    const jwtPayload: GatewayJWTPayload = {
      sub: userId,                                                     // User ID from authenticated user
      iss: POS_GATEWAY_BASE_URL,                                       // Issuer: POS API Gateway
      aud: POS_API_BASE_URL,                                           // Audience: POS Backend Worker
      iat: getCurrentUnixTimestamp(),                                  // Issued at timestamp
      exp: addMinutesToCurrentTime(GATEWAY_TOKEN_EXPIRATION_MINUTES),  // Token expiration (5 minutes)
    };

    /* Sign gateway JWT with secret key */
    const token = jwt.sign(jwtPayload, jwtSecret);

    return token;

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate gateway JWT token';
    console.error('[GATEWAY-TOKEN] 500: Gateway token generation error', {
      error: errorMessage,
      timestamp: getCurrentISOString()
    });

    throw new Error(errorMessage);
  }
};
