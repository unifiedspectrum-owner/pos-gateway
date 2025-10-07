/* Request utility functions for auth management */

import { Context } from "hono";
import { getCurrentISOString } from "@shared/utils";

/* Interface for request information */
export interface ClientRequestInfo {
  ip_address: string;
  user_agent: string;
}

/* Extract request information for logging and security purposes */
export const extractRequestInfo = (c: Context): ClientRequestInfo => {
  const ipAddress = c.req.header('CF-Connecting-IP') ||
                    c.req.header('cf-connecting-ip') ||
                    c.req.header('X-Forwarded-For') ||
                    c.req.header('x-forwarded-for') ||
                    'unknown';
  const userAgent = c.req.header('User-Agent') ||
                    c.req.header('user-agent') ||
                    'unknown';

  /* Log extracted client request information */
  // console.log('[REQUEST-INFO] 200: Extracted client request information', {
  //   ipAddress,
  //   userAgent,
  //   timestamp: getCurrentISOString()
  // });

  return {
    ip_address: ipAddress,
    user_agent: userAgent
  };
};