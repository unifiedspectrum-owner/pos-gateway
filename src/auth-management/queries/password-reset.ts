/* Password reset management queries for authentication */

/* Create password reset token */
export const CREATE_PASSWORD_RESET_TOKEN_QUERY = `
  INSERT INTO password_reset_tokens (
    user_id, token, expires_at
  ) VALUES (?, ?, ?);
`;

/* Get valid password reset token */
export const GET_PASSWORD_RESET_TOKEN_QUERY = `
  SELECT
    id,
    user_id,
    token,
    expires_at,
    used_at,
    created_at
  FROM password_reset_tokens
  WHERE token = ?
  LIMIT 1;
`;

/* Update user password */
export const UPDATE_USER_PASSWORD_QUERY = `
  UPDATE users
  SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?;
`;

/* Mark password reset token as used by token */
export const MARK_PASSWORD_RESET_TOKEN_USED_QUERY = `
  UPDATE password_reset_tokens
  SET used_at = ?, updated_at = CURRENT_TIMESTAMP
  WHERE token = ?;
`;