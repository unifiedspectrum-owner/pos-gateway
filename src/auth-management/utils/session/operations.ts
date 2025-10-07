/* Libraries imports */
import { generateUUID } from '@shared/utils';

/* Shared module imports */
import { addDaysToCurrentDate, isISODateExpired } from '@shared/utils';

/* Auth management module imports */
import { DEFAULT_SESSION_EXPIRATION_DAYS, REMEMBER_ME_EXPIRATION_DAYS } from '@auth-management/constants';


/* Generate secure session ID */
export const generateSessionId = (): string => {
  const sessionId = generateUUID();
  return `session-${sessionId}`;
};

/* Calculate session expiration date based on remember_me preference */
export const calculateSessionExpiration = (rememberMe: boolean = false): Date => {
  const daysToAdd = rememberMe ? REMEMBER_ME_EXPIRATION_DAYS : DEFAULT_SESSION_EXPIRATION_DAYS;
  const expirationISOString = addDaysToCurrentDate(daysToAdd);

  return new Date(expirationISOString);
};

/* Check if a session is expired */
export const isSessionExpired = (expirationDate: string | Date): boolean => {
  const expiration = typeof expirationDate === 'string'
    ? expirationDate
    : expirationDate.toISOString();

  return isISODateExpired(expiration);
};