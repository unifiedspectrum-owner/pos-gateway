/* Shared module imports */
import { addMinutesToCurrentDate, isISODateExpired } from '@shared/utils/time';

/* Auth management module imports */
import { MAX_CONSECUTIVE_FAILED_ATTEMPTS, ACCOUNT_LOCK_DURATION_MINUTES } from '@auth-management/constants';
import { UserWithRole } from '@auth-management/types';

/* Check if user account is currently locked */
export const isAccountLocked = (user: UserWithRole): boolean => {
  if (!user?.account_locked_until) return false;

  return !isISODateExpired(user.account_locked_until);
};

/* Calculate account lock expiration time */
export const calculateAccountLockExpiration = (): string => {
  return addMinutesToCurrentDate(ACCOUNT_LOCK_DURATION_MINUTES);
};

/* Check if user should be locked based on failed attempts */
export const shouldLockAccount = (consecutiveFailedAttempts: number): boolean => {
  return consecutiveFailedAttempts >= MAX_CONSECUTIVE_FAILED_ATTEMPTS;
};