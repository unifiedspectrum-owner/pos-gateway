/* Session management queries for authentication */

/* Create new user session */
export const CREATE_SESSION_QUERY = `
  INSERT INTO user_sessions (
    session_id, user_id, ip_address, user_agent, device_fingerprint, expires_at
  ) VALUES (?, ?, ?, ?, ?, ?);
`;

/* Update session last activity timestamp */
export const UPDATE_SESSION_ACTIVITY_QUERY = `
  UPDATE user_sessions
  SET last_activity = CURRENT_TIMESTAMP
  WHERE session_id = ? AND is_active = 1;
`;

/* Session cleanup queries */

/* Deactivate specific user session */
export const DEACTIVATE_SESSION_QUERY = `
  UPDATE user_sessions
  SET is_active = 0, last_activity = CURRENT_TIMESTAMP
  WHERE session_id = ? AND user_id = ?;
`;

/* Session validation queries */

/* Validate session existence and ownership (optimized for validation only) */
export const VALIDATE_SESSION_QUERY = `
  SELECT user_id, expires_at, is_active
  FROM user_sessions
  WHERE session_id = ?
  LIMIT 1;
`;