/* Two-Factor Authentication backup code generation utilities */

/* Auth management imports */
import { BACKUP_CODE_DIGITS_REGEX } from '@auth-management/constants';

/* Generate a set of backup codes for 2FA */
export const generateBackupCodes = (count: number = 10, length: number = 8): string[] => {
  const codes: string[] = [];
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < count; i++) {
    /* Generate 8-digit backup code */
    let code = "";
    for (let j = 0; j < length; j++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      code += charset[randomIndex];
    }
    codes.push(code);
  }

  return codes;
};

/* Validate backup code format */
export const isValidBackupCodeFormat = (code: string): boolean => {
  return BACKUP_CODE_DIGITS_REGEX.test(code);
};

/* Format backup codes for display (with separators) */
export const formatBackupCodesForDisplay = (codes: string[]): string[] => {
  return codes.map(code => {
    /* Insert hyphen in the middle of the code for readability */
    const halfLength = Math.floor(code.length / 2);
    return `${code.slice(0, halfLength)}-${code.slice(halfLength)}`;
  });
};

/* Format backup codes for email display */
export const formatBackupCodesForEmail = (codes: string[]): string => {
  const formattedCodes = formatBackupCodesForDisplay(codes);
  return formattedCodes
    .map((code, index) => `${(index + 1).toString().padStart(2, ' ')}. ${code}`)
    .join('\n');
};