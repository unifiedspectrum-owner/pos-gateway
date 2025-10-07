/* Authentication queries for login and logout operations */

/* Get user with role information by ID for 2FA validation */
export const GET_USER_BY_ID_QUERY = `
  SELECT
    u.id,
    u.f_name,
    u.l_name,
    u.email,
    u.password_hash,
    u.role_id,
    u.status,
    u.email_verified,
    u.phone_verified,
    u.account_locked_until,
    u.requires_password_change,
    u.last_password_change,
    u.is_active,
    u.is_2fa_required,
    u.is_2fa_enabled,
    r.name as role_name
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id AND r.is_active = 1
  WHERE u.id = ? AND u.is_active = 1
  LIMIT 1;
`;

/* Authentication validation queries for existence checks */

/* Check if user exists and get basic info */
export const CHECK_USER_EXISTS_QUERY = `
  SELECT id, f_name, l_name, email
  FROM users
  WHERE id = ? AND is_active = 1
  LIMIT 1;
`;

/* Get role details by role ID */
export const GET_ROLE_BY_ID_QUERY = `
  SELECT
    r.id,
    r.name,
    r.description,
    r.display_order,
    r.created_at,
    r.updated_at,
    r.is_active
  FROM roles r
  WHERE r.id = ? AND r.is_active = 1
  LIMIT 1;
`;

/* Check if user phone already exists */
export const CHECK_USER_PHONE_EXISTS_QUERY = `
  SELECT id
  FROM users
  WHERE phone = ? AND is_active = 1
  LIMIT 1;
`;

/* Check if user email already exists */
export const CHECK_USER_EMAIL_EXISTS_QUERY = `
  SELECT id
  FROM users
  WHERE email = ? AND is_active = 1
  LIMIT 1;
`;

/* Account locking queries */

/* Lock user account until specified time */
export const LOCK_USER_ACCOUNT_QUERY = `
  UPDATE users
  SET 
    account_locked_until = ?,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = ?;
`;

/* Get user's current consecutive failed attempts count */
export const GET_USER_FAILED_ATTEMPTS_QUERY = `
  SELECT
    consecutive_failed_attempts,
    last_failed_login_at
  FROM user_login_statistics
  WHERE user_id = ?
  LIMIT 1;
`;