/* Shared module imports */
import { addHoursToCurrentDate, isISODateExpired } from '@shared/utils/time';
import { DEFAULT_2FA_LOCK_DURATION_HOURS } from '@shared/constants';

/* Auth management module imports */
import type { TwoFactorSecurityData } from '@auth-management/types';

/* Two-Factor Authentication security utility functions */

/* Check if 2FA is currently locked */
export const is2FALocked = (twoFactorData: TwoFactorSecurityData): boolean => {
  /* Check if explicitly locked */
  if (Boolean(twoFactorData.is_locked)) {
    /* If locked_until is not set, it's permanently locked */
    if (!twoFactorData.locked_until) return true;

    /* Check if lock period has expired */
    return !isISODateExpired(twoFactorData.locked_until);
  }

  /* Check if failed attempts exceed maximum (fallback) */
  return twoFactorData.failed_attempts >= twoFactorData.max_failed_attempts;
};

/* Check if 2FA should be locked based on failed attempts */
export const should2FABeLocked = (failedAttempts: number, maxFailedAttempts: number): boolean => {
  return failedAttempts >= maxFailedAttempts;
};

/* Calculate 2FA lock expiration time */
export const calculate2FALockExpiration = (): string => {
  return addHoursToCurrentDate(DEFAULT_2FA_LOCK_DURATION_HOURS);
};