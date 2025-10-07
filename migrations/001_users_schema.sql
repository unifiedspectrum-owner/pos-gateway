-- ===== REORGANIZED RBAC SYSTEM =====
-- Clean and organized user management and permission system

-- ===== MODULES TABLE =====
CREATE TABLE IF NOT EXISTS modules (
  /* Primary Key */
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  /* Module Identification */
  code TEXT NOT NULL UNIQUE, /* Unique module identifier code */
  name TEXT NOT NULL, /* Display name of the module */
  description TEXT NOT NULL, /* Detailed module description */
  display_order INTEGER NOT NULL DEFAULT 0, /* Sort order for UI display */

  /* Routing */
  endpoint_pattern VARCHAR(200), /* API endpoint pattern (e.g., '/api/v1/pos/') */

  /* Status */
  is_active BOOLEAN NOT NULL DEFAULT 1, /* Module activation status */
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, /* Record creation timestamp */
  updated_at TIMESTAMP /* Last modification timestamp */
);

-- ===== ROLES TABLE =====
CREATE TABLE IF NOT EXISTS roles (
  /* Primary Key */
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  /* Role Information */
  name TEXT NOT NULL UNIQUE, /* Unique role name (e.g., 'super-admin', 'admin') */
  description TEXT NOT NULL, /* Detailed role description */
  display_order INTEGER NOT NULL DEFAULT 0, /* Sort order for UI display */

  /* Status */
  is_active BOOLEAN NOT NULL DEFAULT 1, /* Role activation status */

  /* Audit Trail */
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, /* Record creation timestamp */
  created_by INTEGER, /* Admin who created this role */
  updated_at TIMESTAMP, /* Last modification timestamp */
  deleted_at TIMESTAMP, /* Soft delete timestamp */
  deleted_by INTEGER, /* Admin who deleted this role */

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== ROLE PERMISSIONS TABLE =====
CREATE TABLE IF NOT EXISTS role_permissions (
  /* Primary Key */
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  /* Permission Assignment */
  role_id INTEGER NOT NULL, /* Role receiving permissions */
  module_id INTEGER NOT NULL, /* Module being accessed */

  /* CRUD Permissions */
  can_create BOOLEAN DEFAULT 0, /* Permission to create records */
  can_read BOOLEAN DEFAULT 0, /* Permission to read records */
  can_update BOOLEAN DEFAULT 0, /* Permission to update records */
  can_delete BOOLEAN DEFAULT 0, /* Permission to delete records */

  /* Display & Status */
  display_order INTEGER NOT NULL DEFAULT 0, /* Sort order for UI display */
  is_active BOOLEAN NOT NULL DEFAULT 1, /* Permission activation status */

  /* Audit Trail */
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, /* Record creation timestamp */
  updated_at TIMESTAMP, /* Last modification timestamp */

  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- ===== USERS TABLE =====
CREATE TABLE IF NOT EXISTS users (
  /* Primary Key */
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  /* Role Assignment */
  role_id INTEGER NOT NULL, /* User's assigned role for permissions */

  /* Personal Information */
  f_name TEXT NOT NULL, /* User's first name */
  l_name TEXT NOT NULL, /* User's last name */
  email TEXT NOT NULL UNIQUE, /* Primary email address for login */
  phone TEXT UNIQUE, /* Phone number for login and notifications */
  profile_image_url TEXT, /* URL to user's profile picture */

  /* Authentication */
  password_hash TEXT NOT NULL, /* Bcrypt/Argon2 hashed password */
  requires_password_change BOOLEAN DEFAULT 0, /* Force password change on next login */
  password_expires_at TIMESTAMP, /* Automatic password expiration date */
  last_password_change TIMESTAMP, /* Track password change history */
  is_2fa_required BOOLEAN DEFAULT 0, /* Require 2FA for this user */
  is_2fa_enabled BOOLEAN DEFAULT 0, /* User has enabled 2FA */

  /* Recovery Information */
  recovery_email TEXT, /* Alternate email for account recovery */
  recovery_phone TEXT, /* Alternate phone for account recovery */

  /* Account Security */
  account_locked_until TIMESTAMP, /* Temporary account lock expiration */

  /* Account Status */
  status TEXT NOT NULL CHECK(status IN ('active', 'suspended', 'locked', 'inactive', 'pending_verification')) DEFAULT 'pending_verification', /* Current account state */
  email_verified BOOLEAN DEFAULT 0, /* Email verification status */
  phone_verified BOOLEAN DEFAULT 0, /* Phone verification status */
  email_verified_at TIMESTAMP, /* Email verification timestamp */
  phone_verified_at TIMESTAMP, /* Phone verification timestamp */

  /* Audit Trail */
  created_by INTEGER, /* Admin who created this user */
  is_active BOOLEAN NOT NULL DEFAULT 1, /* Soft delete flag */
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, /* Record creation timestamp */
  updated_at TIMESTAMP, /* Last modification timestamp */
  deleted_at TIMESTAMP, /* Soft delete timestamp */
  deleted_by INTEGER, /* Admin who deleted this user */

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- ===== USER PERMISSIONS TABLE =====
CREATE TABLE IF NOT EXISTS user_permissions (
  /* Primary Key */
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  /* Permission Assignment */
  user_id INTEGER NOT NULL, /* User receiving direct permissions */
  module_id INTEGER NOT NULL, /* Module being accessed */

  /* CRUD Permissions */
  can_create BOOLEAN DEFAULT 0, /* Permission to create records */
  can_read BOOLEAN DEFAULT 0, /* Permission to read records */
  can_update BOOLEAN DEFAULT 0, /* Permission to update records */
  can_delete BOOLEAN DEFAULT 0, /* Permission to delete records */

  /* Display */
  display_order INTEGER NOT NULL DEFAULT 0, /* Sort order for UI display */

  /* Assignment Details */
  granted_by INTEGER NOT NULL, /* Admin who granted this permission */
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, /* Permission grant timestamp */
  expires_at TIMESTAMP, /* Permission expiration (NULL = permanent) */
  override_reason TEXT, /* Justification for role override */

  /* Status */
  is_active BOOLEAN NOT NULL DEFAULT 1, /* Permission activation status */
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, /* Record creation timestamp */
  updated_at TIMESTAMP, /* Last modification timestamp */

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- ===== USER SESSIONS TABLE =====
CREATE TABLE IF NOT EXISTS user_sessions (
  /* Primary Key */
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  /* Session Identification */
  session_id TEXT NOT NULL UNIQUE, /* Unique session identifier */
  user_id INTEGER NOT NULL, /* User owning this session */

  /* Session Context */
  ip_address TEXT, /* Client IP address */
  user_agent TEXT, /* Browser/app user agent string */
  device_fingerprint TEXT, /* Unique device identifier */

  /* Session Lifecycle */
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, /* Session start timestamp */
  expires_at TIMESTAMP NOT NULL, /* Session expiration timestamp */
  last_activity TIMESTAMP, /* Last activity timestamp */
  is_active BOOLEAN NOT NULL DEFAULT 1, /* Session active status */

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== USER ACTIVITY LOGS TABLE =====
CREATE TABLE IF NOT EXISTS user_activity_logs (
  /* Primary Key */
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  /* Context */
  user_id INTEGER, /* User performing the action (NULL for system actions) */
  session_id TEXT, /* Associated session identifier */

  /* Action Details */
  action_type TEXT NOT NULL CHECK(action_type IN (
    'user_login', 'user_logout', 'permission_grant', 'permission_revoke',
    'role_assign', 'role_revoke', 'user_create', 'user_update', 'user_delete',
    'password_change', 'account_lock', 'account_unlock', 'account_locked', 'session_create',
    'session_terminate', 'email_verify', 'phone_verify',
    'forgot_password', '2fa_verification', '2fa_locked'
  )), /* Type of action performed */

  /* Change Tracking */
  old_values TEXT, /* JSON object with previous state */
  new_values TEXT, /* JSON object with new state */
  change_description TEXT, /* Human-readable change summary */

  /* Request Context */
  ip_address TEXT, /* Client IP address */
  user_agent TEXT, /* Browser/app user agent string */
  device_fingerprint TEXT, /* Unique device identifier */

  /* Result */
  action_result TEXT CHECK(action_result IN ('success', 'failure')) DEFAULT 'success', /* Action outcome */
  error_message TEXT, /* Error details if failed */

  /* Admin Actions */
  performed_by INTEGER, /* Admin who performed the action */

  /* Audit */
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, /* Action timestamp */

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== USER LOGIN STATISTICS TABLE =====
CREATE TABLE IF NOT EXISTS user_login_statistics (
  /* Primary Key */
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE, /* User being tracked */

  /* Login Counters */
  total_logins INTEGER DEFAULT 0, /* Total login attempts (successful + failed) */
  successful_logins INTEGER DEFAULT 0, /* Count of successful logins */
  failed_logins INTEGER DEFAULT 0, /* Count of failed login attempts */
  consecutive_failed_attempts INTEGER DEFAULT 0, /* Current failed attempt streak */

  /* Timestamps */
  first_login_at TIMESTAMP, /* User's first successful login */
  last_successful_login_at TIMESTAMP, /* Most recent successful login */
  last_failed_login_at TIMESTAMP, /* Most recent failed login attempt */

  /* Last Login Context */
  last_login_ip TEXT, /* IP address of last login */
  last_user_agent TEXT, /* User agent of last login */
  last_device_fingerprint TEXT, /* Device fingerprint of last login */

  /* Session Management */
  active_sessions INTEGER DEFAULT 0, /* Current active session count */
  max_concurrent_sessions INTEGER DEFAULT 3, /* Maximum allowed concurrent sessions */

  /* Security Metrics */
  password_changes_count INTEGER DEFAULT 0, /* Total password changes */
  account_lockouts_count INTEGER DEFAULT 0, /* Total account lockouts */
  last_lockout_at TIMESTAMP, /* Most recent lockout timestamp */

  /* Two-Factor Authentication Statistics */
  tfa_enabled_at TIMESTAMP, /* When 2FA was enabled */
  tfa_disabled_at TIMESTAMP, /* When 2FA was disabled */
  tfa_backup_codes_used INTEGER DEFAULT 0, /* Count of backup codes used */
  tfa_failures_count INTEGER DEFAULT 0, /* Count of 2FA verification failures */

  /* Audit Trail */
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, /* Record creation timestamp */
  updated_at TIMESTAMP, /* Last modification timestamp */

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== USER TWO-FACTOR AUTHENTICATION TABLE =====
CREATE TABLE IF NOT EXISTS user_two_factor_auth (
  /* Primary Key */
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE, /* User with 2FA enabled */

  /* Authentication Codes */
  secret TEXT, /* TOTP secret key */
  login_code TEXT, /* Current verification code */
  backup_codes TEXT, /* JSON array of backup recovery codes */
  backup_codes_generated_at TIMESTAMP, /* Backup codes generation timestamp */
  backup_codes_used_count INTEGER DEFAULT 0, /* Count of backup codes consumed */

  /* Usage Statistics */
  total_verifications INTEGER DEFAULT 0, /* Total verification attempts */
  successful_verifications INTEGER DEFAULT 0, /* Successful verifications count */
  failed_verifications INTEGER DEFAULT 0, /* Failed verifications count */
  last_successful_verification TIMESTAMP, /* Most recent successful verification */
  last_failed_verification TIMESTAMP, /* Most recent failed verification */

  /* Security Settings */
  max_failed_attempts INTEGER DEFAULT 5, /* Maximum allowed failed attempts */
  failed_attempts INTEGER DEFAULT 0, /* Current failed attempt count */
  is_locked BOOLEAN DEFAULT 0, /* 2FA temporarily locked status */
  locked_until TIMESTAMP, /* Lock expiration timestamp */

  /* Status */
  is_active BOOLEAN NOT NULL DEFAULT 1, /* 2FA activation status */
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, /* Record creation timestamp */
  updated_at, /* Last modification timestamp */

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== PASSWORD RESET TOKENS TABLE =====
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  /* Primary Key */
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  /* Token Assignment */
  user_id INTEGER NOT NULL, /* User requesting password reset */
  token TEXT UNIQUE NOT NULL, /* Unique reset token (hashed) */

  /* Token Lifecycle */
  expires_at TIMESTAMP NOT NULL, /* Token expiration timestamp */
  is_used BOOLEAN DEFAULT 0, /* Token usage status */
  used_at TIMESTAMP, /* When token was consumed */

  /* Security Context */
  ip_address TEXT, /* IP address of reset request */

  /* Status */
  is_active BOOLEAN DEFAULT 1, /* Token active status */
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* Token creation timestamp */
  updated_at TIMESTAMP, /* Last modification timestamp */

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== PERFORMANCE INDEXES =====

-- ===== MODULES TABLE INDEXES =====
CREATE INDEX idx_modules_name ON modules(name) WHERE is_active = 1; /* Module search by name */
CREATE INDEX idx_modules_active ON modules(is_active, display_order); /* Active module listing */
CREATE INDEX idx_modules_endpoint ON modules(endpoint_pattern) WHERE endpoint_pattern IS NOT NULL; /* Route matching */

-- ===== ROLES TABLE INDEXES =====
CREATE INDEX idx_roles_name ON roles(name) WHERE is_active = 1; /* Role search by name */
CREATE INDEX idx_roles_active ON roles(is_active, display_order); /* Active role listing */

-- ===== ROLE PERMISSIONS TABLE INDEXES =====
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id) WHERE is_active = 1; /* Permissions by role */
CREATE INDEX idx_role_permissions_module ON role_permissions(module_id) WHERE is_active = 1; /* Permissions by module */
CREATE INDEX idx_role_permissions_crud ON role_permissions(can_create, can_read, can_update, can_delete) WHERE is_active = 1; /* CRUD permission checks */
CREATE INDEX idx_role_permissions_composite ON role_permissions(role_id, module_id) WHERE is_active = 1; /* Fast permission resolution */
CREATE INDEX idx_role_perms_covering ON role_permissions(role_id, module_id, can_create, can_read, can_update, can_delete, is_active) WHERE is_active = 1; /* Authentication covering index */

-- ===== USERS TABLE INDEXES =====
CREATE INDEX idx_users_email ON users(email) WHERE is_active = 1; /* Login by email */
CREATE INDEX idx_users_phone ON users(phone) WHERE is_active = 1 AND phone IS NOT NULL; /* Login by phone */
CREATE INDEX idx_users_status ON users(status, is_active); /* User status filtering */
CREATE INDEX idx_users_verification ON users(email_verified, phone_verified) WHERE is_active = 1; /* Verification status checks */
CREATE INDEX idx_users_name_search ON users(f_name, l_name) WHERE is_active = 1; /* Name-based user search */
CREATE INDEX idx_users_created_by ON users(created_by) WHERE created_by IS NOT NULL; /* Creator tracking */
CREATE INDEX idx_users_locked ON users(account_locked_until) WHERE account_locked_until IS NOT NULL; /* Locked account checks */
CREATE INDEX idx_users_password_change ON users(requires_password_change) WHERE requires_password_change = 1; /* Password change requirements */
CREATE INDEX idx_users_password_expires ON users(password_expires_at) WHERE password_expires_at IS NOT NULL; /* Password expiration checks */
CREATE INDEX idx_users_created_at ON users(created_at, is_active) WHERE is_active = 1; /* Chronological user listing */
CREATE INDEX idx_users_updated_at ON users(updated_at) WHERE is_active = 1; /* Recent activity tracking */
CREATE INDEX idx_users_search_composite ON users(status, email_verified, phone_verified, is_active) WHERE is_active = 1; /* Multi-criteria user search */
CREATE INDEX idx_users_auth_covering ON users(email, password_hash, status, is_active, account_locked_until) WHERE is_active = 1; /* Authentication covering index */
CREATE INDEX idx_users_pagination ON users(id, created_at, is_active) WHERE is_active = 1; /* Pagination optimization */

-- ===== USER PERMISSIONS TABLE INDEXES =====
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id) WHERE is_active = 1; /* User's direct permissions */
CREATE INDEX idx_user_permissions_module ON user_permissions(module_id) WHERE is_active = 1; /* Module permission assignments */
CREATE INDEX idx_user_permissions_granted_by ON user_permissions(granted_by); /* Permission audit trail */
CREATE INDEX idx_user_permissions_expires ON user_permissions(expires_at) WHERE expires_at IS NOT NULL; /* Expiring permissions */
CREATE INDEX idx_user_permissions_crud ON user_permissions(can_create, can_read, can_update, can_delete) WHERE is_active = 1; /* CRUD permission checks */
CREATE INDEX idx_user_permissions_composite ON user_permissions(user_id, module_id) WHERE is_active = 1; /* Fast permission lookup */
CREATE INDEX idx_user_permissions_granted_at ON user_permissions(granted_at); /* Permission grant history */
CREATE INDEX idx_permissions_cleanup ON user_permissions(expires_at) WHERE expires_at IS NOT NULL AND is_active = 1; /* Cleanup operations */

-- ===== USER SESSIONS TABLE INDEXES =====
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id) WHERE is_active = 1; /* User's active sessions */
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at, is_active); /* Session expiration checks */
CREATE INDEX idx_user_sessions_activity ON user_sessions(last_activity) WHERE is_active = 1; /* Recent activity tracking */
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id) WHERE is_active = 1; /* Session ID lookup */
CREATE INDEX idx_user_sessions_ip ON user_sessions(ip_address, created_at); /* IP-based security analysis */
CREATE INDEX idx_user_sessions_device ON user_sessions(device_fingerprint) WHERE device_fingerprint IS NOT NULL; /* Device tracking */
CREATE INDEX idx_user_sessions_user_agent ON user_sessions(user_agent) WHERE user_agent IS NOT NULL; /* Browser/app identification */
CREATE INDEX idx_user_sessions_created_at ON user_sessions(created_at, is_active) WHERE is_active = 1; /* Session creation tracking */
CREATE INDEX idx_sessions_security ON user_sessions(user_id, ip_address, device_fingerprint, created_at) WHERE is_active = 1; /* Security monitoring */
CREATE INDEX idx_sessions_validation_covering ON user_sessions(session_id, user_id, expires_at, is_active) WHERE is_active = 1; /* Session validation covering */
CREATE INDEX idx_sessions_cleanup ON user_sessions(expires_at) WHERE is_active = 1; /* Session cleanup operations */
CREATE INDEX idx_sessions_pagination ON user_sessions(id, created_at, is_active) WHERE is_active = 1; /* Pagination optimization */

-- ===== USER ACTIVITY LOGS TABLE INDEXES =====
CREATE INDEX idx_activity_logs_user ON user_activity_logs(user_id, created_at); /* User activity history */
CREATE INDEX idx_activity_logs_action ON user_activity_logs(action_type, created_at); /* Action type filtering */
CREATE INDEX idx_activity_logs_session ON user_activity_logs(session_id) WHERE session_id IS NOT NULL; /* Session-based activity */
CREATE INDEX idx_activity_logs_performed_by ON user_activity_logs(performed_by) WHERE performed_by IS NOT NULL; /* Admin action tracking */
CREATE INDEX idx_activity_logs_result ON user_activity_logs(action_result, created_at); /* Success/failure analysis */
CREATE INDEX idx_activity_logs_ip ON user_activity_logs(ip_address, created_at); /* IP-based security analysis */
CREATE INDEX idx_activity_logs_device ON user_activity_logs(device_fingerprint) WHERE device_fingerprint IS NOT NULL; /* Device tracking */
CREATE INDEX idx_activity_logs_error ON user_activity_logs(action_result, error_message) WHERE action_result = 'failure'; /* Error analysis */
CREATE INDEX idx_activity_logs_created_at ON user_activity_logs(created_at); /* Chronological activity */
CREATE INDEX idx_activity_security ON user_activity_logs(user_id, action_type, action_result, ip_address, created_at); /* Security analysis */
CREATE INDEX idx_activity_pagination ON user_activity_logs(id, created_at); /* Pagination optimization */

-- ===== USER LOGIN STATISTICS TABLE INDEXES =====
CREATE INDEX idx_login_stats_user ON user_login_statistics(user_id); /* User statistics lookup */
CREATE INDEX idx_login_stats_last_login ON user_login_statistics(last_successful_login_at); /* Recent login tracking */
CREATE INDEX idx_login_stats_failed_attempts ON user_login_statistics(consecutive_failed_attempts) WHERE consecutive_failed_attempts > 0; /* Security monitoring */
CREATE INDEX idx_login_stats_lockouts ON user_login_statistics(account_lockouts_count) WHERE account_lockouts_count > 0; /* Lockout tracking */
CREATE INDEX idx_login_stats_active_sessions ON user_login_statistics(active_sessions) WHERE active_sessions > 0; /* Concurrent session monitoring */
CREATE INDEX idx_login_stats_first_login ON user_login_statistics(first_login_at); /* User onboarding tracking */
CREATE INDEX idx_login_stats_failed_login ON user_login_statistics(last_failed_login_at); /* Failed login analysis */
CREATE INDEX idx_login_stats_ip ON user_login_statistics(last_login_ip) WHERE last_login_ip IS NOT NULL; /* Location tracking */
CREATE INDEX idx_login_stats_device ON user_login_statistics(last_device_fingerprint) WHERE last_device_fingerprint IS NOT NULL; /* Device tracking */
CREATE INDEX idx_login_stats_totals ON user_login_statistics(total_logins, successful_logins, failed_logins); /* Usage analytics */
CREATE INDEX idx_login_stats_tfa_enabled ON user_login_statistics(tfa_enabled_at) WHERE tfa_enabled_at IS NOT NULL; /* 2FA adoption tracking */
CREATE INDEX idx_login_stats_tfa_disabled ON user_login_statistics(tfa_disabled_at) WHERE tfa_disabled_at IS NOT NULL; /* 2FA usage tracking */
CREATE INDEX idx_login_stats_updated_at ON user_login_statistics(updated_at); /* Recent activity tracking */
CREATE INDEX idx_login_security ON user_login_statistics(consecutive_failed_attempts, account_lockouts_count, last_failed_login_at); /* Security monitoring */
CREATE INDEX idx_login_dashboard_covering ON user_login_statistics(user_id, total_logins, successful_logins, failed_logins, last_successful_login_at, active_sessions); /* Dashboard covering */

-- ===== USER TWO-FACTOR AUTH TABLE INDEXES =====
CREATE INDEX idx_tfa_user ON user_two_factor_auth(user_id); /* User 2FA lookup */
CREATE INDEX idx_tfa_locked ON user_two_factor_auth(is_locked, locked_until) WHERE is_locked = 1; /* Locked 2FA accounts */
CREATE INDEX idx_tfa_active ON user_two_factor_auth(is_active) WHERE is_active = 1; /* Active 2FA users */
CREATE INDEX idx_tfa_backup_codes_generated ON user_two_factor_auth(backup_codes_generated_at) WHERE backup_codes_generated_at IS NOT NULL; /* Backup code tracking */
CREATE INDEX idx_tfa_last_verification ON user_two_factor_auth(last_successful_verification) WHERE last_successful_verification IS NOT NULL; /* Recent 2FA usage */
CREATE INDEX idx_tfa_failed_verification ON user_two_factor_auth(last_failed_verification) WHERE last_failed_verification IS NOT NULL; /* Failed 2FA attempts */
CREATE INDEX idx_tfa_verification_counts ON user_two_factor_auth(total_verifications, successful_verifications, failed_verifications); /* 2FA analytics */
CREATE INDEX idx_tfa_created_at ON user_two_factor_auth(created_at, is_active) WHERE is_active = 1; /* 2FA adoption tracking */
CREATE INDEX idx_tfa_updated_at ON user_two_factor_auth(updated_at) WHERE is_active = 1; /* Recent 2FA activity */
CREATE INDEX idx_tfa_security ON user_two_factor_auth(failed_verifications, is_locked, locked_until); /* 2FA security monitoring */
CREATE INDEX idx_tfa_unlock_cleanup ON user_two_factor_auth(locked_until) WHERE is_locked = 1 AND locked_until IS NOT NULL; /* 2FA unlock cleanup */

-- ===== PASSWORD RESET TOKENS TABLE INDEXES =====
CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id) WHERE is_active = 1; /* User's reset tokens */
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token) WHERE is_active = 1 AND is_used = 0; /* Token lookup for validation */
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at, is_active) WHERE is_active = 1; /* Expiration checks */
CREATE INDEX idx_password_reset_active_unused ON password_reset_tokens(is_active, is_used, expires_at); /* Active unused tokens */
CREATE INDEX idx_password_reset_cleanup ON password_reset_tokens(expires_at) WHERE is_active = 1; /* Cleanup expired tokens */
CREATE INDEX idx_password_reset_security ON password_reset_tokens(user_id, ip_address, created_at) WHERE is_active = 1; /* Security monitoring */
CREATE INDEX idx_password_reset_used ON password_reset_tokens(used_at) WHERE is_used = 1; /* Used token tracking */
CREATE INDEX idx_password_reset_created_at ON password_reset_tokens(created_at, is_active) WHERE is_active = 1; /* Chronological tracking */
CREATE INDEX idx_password_reset_covering ON password_reset_tokens(token, user_id, expires_at, is_used, is_active) WHERE is_active = 1; /* Token validation covering */

-- ===== TRIGGERS FOR AUTOMATIC UPDATES =====

/* Automatically update modules.updated_at timestamp on record modification */
CREATE TRIGGER trg_modules_updated_at
    AFTER UPDATE ON modules
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE modules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

/* Automatically update roles.updated_at timestamp on record modification */
CREATE TRIGGER trg_roles_updated_at
    AFTER UPDATE ON roles
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

/* Automatically update role_permissions.updated_at timestamp on record modification */
CREATE TRIGGER trg_role_permissions_updated_at
    AFTER UPDATE ON role_permissions
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE role_permissions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

/* Automatically update users.updated_at timestamp on record modification */
CREATE TRIGGER trg_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

/* Automatically update user_permissions.updated_at timestamp on record modification */
CREATE TRIGGER trg_user_permissions_updated_at
    AFTER UPDATE ON user_permissions
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE user_permissions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

/* Automatically update user_login_statistics.updated_at timestamp on record modification */
CREATE TRIGGER trg_user_login_statistics_updated_at
    AFTER UPDATE ON user_login_statistics
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE user_login_statistics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

/* Automatically update user_two_factor_auth.updated_at timestamp on record modification */
CREATE TRIGGER trg_user_two_factor_auth_updated_at
    AFTER UPDATE ON user_two_factor_auth
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE user_two_factor_auth SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

/* Automatically update password_reset_tokens.updated_at timestamp on record modification */
CREATE TRIGGER trg_password_reset_tokens_updated_at
    AFTER UPDATE ON password_reset_tokens
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE password_reset_tokens SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

/* Automatically update user_sessions.last_activity timestamp when session is accessed */
CREATE TRIGGER trg_update_session_activity
    AFTER UPDATE ON user_sessions
    FOR EACH ROW
    WHEN NEW.is_active = 1 AND OLD.last_activity != NEW.last_activity
BEGIN
    UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

/* Automatically deactivate expired sessions and decrement active session count */
CREATE TRIGGER trg_deactivate_expired_sessions
    AFTER UPDATE ON user_sessions
    FOR EACH ROW
    WHEN NEW.expires_at < CURRENT_TIMESTAMP AND NEW.is_active = 1
BEGIN
    UPDATE user_sessions SET is_active = 0 WHERE id = NEW.id;
    UPDATE user_login_statistics
    SET active_sessions = active_sessions - 1
    WHERE user_id = NEW.user_id;
END;

