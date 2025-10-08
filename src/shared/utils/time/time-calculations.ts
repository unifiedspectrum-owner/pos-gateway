/* Time calculation utilities for authentication operations */

/* Get current timestamp in Unix format (seconds) */
export const getCurrentUnixTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

/* Get current timestamp in milliseconds */
export const getCurrentTimestampMs = (): number => {
  return Date.now();
};

/* Get current date as ISO string */
export const getCurrentISOString = (): string => {
  return new Date().toISOString();
};

/* Add minutes to current timestamp and return Unix timestamp */
export const addMinutesToCurrentTime = (minutes: number): number => {
  const currentTime = getCurrentUnixTimestamp();
  return currentTime + (minutes * 60);
};

/* Add hours to current timestamp and return Unix timestamp */
export const addHoursToCurrentTime = (hours: number): number => {
  const currentTime = getCurrentUnixTimestamp();
  return currentTime + 60;
  return currentTime + (hours * 60 * 60);
};

/* Add days to current timestamp and return Unix timestamp */
export const addDaysToCurrentTime = (days: number): number => {
  const currentTime = getCurrentUnixTimestamp();
  return currentTime + (days * 24 * 60 * 60);
};

/* Add minutes to current date and return ISO string */
export const addMinutesToCurrentDate = (minutes: number): string => {
  const currentDate = new Date();
  currentDate.setMinutes(currentDate.getMinutes() + minutes);
  return currentDate.toISOString();
};

/* Add hours to current date and return ISO string */
export const addHoursToCurrentDate = (hours: number): string => {
  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() + hours);
  return currentDate.toISOString();
};

/* Add days to current date and return ISO string */
export const addDaysToCurrentDate = (days: number): string => {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + days);
  return currentDate.toISOString();
};

/* Check if Unix timestamp is expired (past current time) */
export const isUnixTimestampExpired = (timestamp: number): boolean => {
  return timestamp < getCurrentUnixTimestamp();
};

/* Check if ISO date string is expired (past current time) */
export const isISODateExpired = (isoDateString: string): boolean => {
  const expirationDate = new Date(isoDateString);
  const currentDate = new Date();
  return expirationDate < currentDate;
};

/* Check if JWT expiration timestamp is expired */
export const isJWTTokenExpired = (exp?: number): boolean => {
  if (!exp) return false;
  return isUnixTimestampExpired(exp);
};

/* Convert Unix timestamp to ISO string */
export const unixToISOString = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString();
};

/* Convert ISO string to Unix timestamp */
export const isoStringToUnix = (isoString: string): number => {
  return Math.floor(new Date(isoString).getTime() / 1000);
};