/* Two-Factor Authentication data structures and interfaces */

/* 2FA Types */
export type TwoFAType = 'totp' | 'backup';

/* Interface for 2FA security data from database */
export interface TwoFactorAuthData {
  secret: string;
  backup_codes: string | null;
  backup_codes_used_count: number;
  max_failed_attempts: number;
  failed_attempts: number;
  is_active: number;
  is_locked?: boolean | number;
  locked_until?: string | null;
}

/* Interface for 2FA security checks (subset for utilities) */
export interface TwoFactorSecurityData {
  failed_attempts: number;
  max_failed_attempts: number;
  is_locked?: boolean | number;
  locked_until?: string | null;
}