/* TypeScript interfaces for email notification parameters */

/* Password reset email options */
export interface PasswordResetOptions {
  to: string;
  userEmail: string;
  userName: string;
  resetToken: string;
}

/* Password reset confirmation email options */
export interface PasswordResetConfirmationOptions {
  to: string;
  userName: string;
  resetTime: string;
  ipAddress?: string;
}

/* Two-factor authentication setup data */
export interface TwoFactorSetupData {
  manualEntryKey: string;
  qrCodeDataURL: string;
  qrCodeBuffer: Buffer;
  backupCodes: string[];
}

/* User 2FA setup email options */
export interface User2FASetupEmailOptions {
  to: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
  twoFactorData?: TwoFactorSetupData;
}

/* User 2FA disabled email options */
export interface User2FADisabledEmailOptions {
  to: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
}
