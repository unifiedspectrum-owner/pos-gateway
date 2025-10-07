/* Authentication timing and security constants */

/* Session expiration constants in days */
export const DEFAULT_SESSION_EXPIRATION_DAYS = 1; // Default session expiration in days
export const REMEMBER_ME_EXPIRATION_DAYS = 7; // Remember me session expiration in days

/* Token expiration constants */
export const ACCESS_TOKEN_EXPIRATION_HOURS = 1; // JWT access token expiration in hours
export const REFRESH_TOKEN_EXPIRATION_DAYS = 7; // Refresh token expiration in days (matches remember me)
export const PASSWORD_RESET_TOKEN_EXPIRATION_HOURS = 1; // Password reset token expiration in hours

/* Account security constants */
export const MAX_CONSECUTIVE_FAILED_ATTEMPTS = 5; // Maximum failed login attempts before account lock
export const ACCOUNT_LOCK_DURATION_MINUTES = 30; // Duration to lock account after max failed attempts
