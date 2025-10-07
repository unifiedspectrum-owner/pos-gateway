/* Libraries imports */
import { z } from 'zod';
import { TWO_FA_TYPES, PASSWORD_COMPLEXITY_REGEX, TOTP_CODE_REGEX, BACKUP_CODE_FORMAT_REGEX } from '@auth-management/constants';

/* Login request validation schema */
export const loginSchema = z.object({
  email: z.email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional().default(false),
});

/* Forgot password request validation schema */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

/* Reset password request validation schema */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(PASSWORD_COMPLEXITY_REGEX, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)'),
  confirm_password: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

/* 2FA token validation request schema */
export const twoFactorValidationSchema = z.object({
  user_id: z.string().min(1, 'user ID is required'),
  type: z.enum([TWO_FA_TYPES.TOTP, TWO_FA_TYPES.BACKUP]),
  code: z.string().min(1, 'Code is required'),
}).refine((data) => {
  if (data.type === TWO_FA_TYPES.TOTP) {
    return data.code.length === 6 && TOTP_CODE_REGEX.test(data.code);
  }
  return true;
}, {
  message: "TOTP code must be exactly 6 digits",
  path: ["code"],
}).refine((data) => {
  if (data.type === TWO_FA_TYPES.BACKUP) {
    return data.code.length === 9;
  }
  return true;
}, {
  message: "Backup code must be exactly 9 characters long",
  path: ["code"],
}).refine((data) => {
  if (data.type === TWO_FA_TYPES.BACKUP) {
    return BACKUP_CODE_FORMAT_REGEX.test(data.code);
  }
  return true;
}, {
  message: "Backup code format is invalid - must not match pattern [A-Za-z0-9]{4}-[A-Za-z0-9]{4}",
  path: ["code"],
});

/* Enable 2FA request validation schema */
export const enable2FASchema = z.object({
  code: z.string()
    .min(1, 'TOTP code is required')
    .length(6, 'TOTP code must be exactly 6 digits')
    .regex(TOTP_CODE_REGEX, 'TOTP code must contain only digits'),
});