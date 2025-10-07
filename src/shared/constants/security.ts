/* Password Security Configuration */
export const DEFAULT_PASSWORD_SALT_ROUNDS = 12;

/* Two-Factor Authentication Configuration */
export const DEFAULT_2FA_MAX_FAILED_ATTEMPTS = 5;
export const DEFAULT_2FA_LOCK_DURATION_HOURS = 1;

/* User Session Configuration */
export const DEFAULT_MAX_CONCURRENT_SESSIONS = 3;

/* Gateway Authentication Configuration */
export const GATEWAY_TOKEN_EXPIRATION_MINUTES = 5; // Gateway token expiration for API Gateway to POS Backend authentication
