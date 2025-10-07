/* Shared module imports */
import { TwoFAType } from "@auth-management/types";

/* Validation patterns and 2FA configuration */

/* Password validation regex pattern */
export const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;

/* 2FA validation regex patterns */
export const TOTP_CODE_REGEX = /^\d{6}$/; // 6-digit TOTP codes
export const BACKUP_CODE_FORMAT_REGEX = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/; // Backup code format validation
export const BACKUP_CODE_DIGITS_REGEX = /^\d{8}$/; // 8-digit backup codes

/* 2FA type constants */
export const TWO_FA_TYPES = {
  TOTP: 'totp',
  BACKUP: 'backup'
} satisfies Record<string, TwoFAType>;

/* Query parameter names */
export const RESET_TOKEN_QUERY_PARAM = 'token';
