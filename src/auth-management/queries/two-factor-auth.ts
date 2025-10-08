/* Two-Factor Authentication queries for login validation */

/* Get user's 2FA secret and settings for token validation */
export const GET_USER_2FA_SECRET_QUERY = `
  SELECT
    secret,
    backup_codes,
    backup_codes_used_count,
    max_failed_attempts,
    failed_attempts,
    is_active,
    is_locked,
    locked_until
  FROM user_two_factor_auth
  WHERE user_id = ? AND is_active = 1
  LIMIT 1;
`;

/* Update 2FA failed attempts counter */
export const UPDATE_2FA_FAILED_ATTEMPTS_QUERY = `
  UPDATE user_two_factor_auth
  SET
    failed_attempts = failed_attempts + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = ? AND is_active = 1;
`;

/* Reset 2FA failed attempts counter on successful validation */
export const RESET_2FA_FAILED_ATTEMPTS_QUERY = `
  UPDATE user_two_factor_auth
  SET
    failed_attempts = 0,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = ? AND is_active = 1;
`;

/* Lock user 2FA temporarily after max failed attempts */
export const LOCK_2FA_AFTER_MAX_ATTEMPTS_QUERY = `
  UPDATE user_two_factor_auth
  SET
    is_locked = 1,
    locked_until = ?,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = ? AND is_active = 1;
`;

/* Update backup codes after one is used */
export const UPDATE_BACKUP_CODES_QUERY = `
  UPDATE user_two_factor_auth
  SET
    backup_codes = ?,
    backup_codes_used_count = backup_codes_used_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = ? AND is_active = 1;
`;

/* Initialize 2FA record for new user */
export const INITIALIZE_USER_2FA_QUERY = `
  INSERT INTO user_two_factor_auth (
    user_id,
    secret,
    backup_codes,
    backup_codes_generated_at,
    max_failed_attempts
  ) VALUES (?, ?, ?, ?, ?);
`;

/* Enable 2FA flag in users table */
export const ENABLE_2FA_QUERY = `
  UPDATE users
  SET
    is_2fa_enabled = 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = ? AND is_active = 1;
`;

/* Disable 2FA flag in users table */
export const DISABLE_2FA_QUERY = `
  UPDATE users
  SET
    is_2fa_enabled = 0,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = ? AND is_active = 1;
`;

/* Delete user 2FA configuration data */
export const DELETE_USER_2FA_QUERY = `
  DELETE FROM user_two_factor_auth
  WHERE user_id = ?;
`;


/* Update existing user two-factor authentication record */
export const REACTIVATE_USER_2FA_QUERY = `
  UPDATE user_two_factor_auth
  SET
    secret = ?,
    backup_codes = ?,
    backup_codes_generated_at = ?,
    max_failed_attempts = ?,
    is_active = 1,
    updated_at = ?
  WHERE user_id = ?;
`;

/* Check if user already has a 2FA record */
export const CHECK_USER_2FA_EXISTS_QUERY = `
  SELECT id, is_active
  FROM user_two_factor_auth
  WHERE user_id = ?
  LIMIT 1;
`;
