/* User login statistics and activity tracking queries */

/* Check if login statistics record exists for user */
export const CHECK_LOGIN_STATS_EXISTS_QUERY = `
  SELECT user_id, first_login_at, active_sessions
  FROM user_login_statistics
  WHERE user_id = ?
  LIMIT 1;
`;

/* Insert initial login statistics record for new user */
export const INSERT_LOGIN_STATS_QUERY = `
  INSERT INTO user_login_statistics (
    user_id, total_logins, successful_logins, failed_logins, consecutive_failed_attempts,
    first_login_at, last_successful_login_at, last_login_ip, last_user_agent,
    last_device_fingerprint, active_sessions, updated_at
  ) VALUES (?, 1, 1, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, 1, CURRENT_TIMESTAMP);
`;

/* Insert initial login statistics record for failed first login */
export const INSERT_LOGIN_STATS_FAILED_QUERY = `
  INSERT INTO user_login_statistics (
    user_id, total_logins, successful_logins, failed_logins, consecutive_failed_attempts,
    last_failed_login_at, last_failed_login_ip, last_failed_user_agent,
    active_sessions, updated_at
  ) VALUES (?, 1, 0, 1, 1, CURRENT_TIMESTAMP, ?, ?, ?, 0, CURRENT_TIMESTAMP);
`;

/* Update login statistics for successful login */
export const UPDATE_LOGIN_STATS_SUCCESS_QUERY = `
  UPDATE user_login_statistics
  SET total_logins = total_logins + 1,
      successful_logins = successful_logins + 1,
      consecutive_failed_attempts = 0,
      last_successful_login_at = CURRENT_TIMESTAMP,
      last_login_ip = ?,
      last_user_agent = ?,
      last_device_fingerprint = ?,
      active_sessions = active_sessions + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE user_id = ?;
`;

/* Update login statistics for failed attempt */
export const UPDATE_LOGIN_STATS_FAILED_QUERY = `
  UPDATE user_login_statistics
  SET total_logins = total_logins + 1,
      failed_logins = failed_logins + 1,
      consecutive_failed_attempts = consecutive_failed_attempts + 1,
      last_failed_login_at = CURRENT_TIMESTAMP,
      last_failed_login_ip = ?,
      updated_at = CURRENT_TIMESTAMP
  WHERE user_id = ?;
`;

/* Session tracking queries */

/* Decrement active sessions count */
export const DECREMENT_ACTIVE_SESSIONS_QUERY = `
  UPDATE user_login_statistics
  SET active_sessions = CASE
    WHEN active_sessions > 0 THEN active_sessions - 1
    ELSE 0
  END,
  updated_at = CURRENT_TIMESTAMP
  WHERE user_id = ?;
`;

/* User activity logging queries */

/* Log user activity for audit trail */
export const LOG_USER_ACTIVITY_QUERY = `
  INSERT INTO user_activity_logs (
    user_id, session_id, action_type, ip_address, user_agent, device_fingerprint,
    action_result, performed_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
`;

/* Get user login statistics by user ID */
export const GET_USER_LOGIN_STATS_QUERY = `
  SELECT
    total_logins,
    successful_logins,
    failed_logins,
    consecutive_failed_attempts,
    first_login_at,
    last_successful_login_at,
    last_failed_login_at,
    active_sessions,
    max_concurrent_sessions
  FROM user_login_statistics
  WHERE user_id = ?
  LIMIT 1;
`;