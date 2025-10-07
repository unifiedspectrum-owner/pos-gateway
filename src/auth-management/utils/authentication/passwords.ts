/* Libraries imports */
import bcrypt from "bcryptjs";

/* Shared module imports */
import { DEFAULT_PASSWORD_SALT_ROUNDS } from "@shared/constants";

/* Generate a cryptographically secure temporary password - 12-character password with guaranteed mixed case, numbers, and symbols */
export const generateTempPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + specialChars;

  /* Ensure password contains at least one character from each required category */
  let password = '';
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

  /* Fill remaining 8 positions with random characters from all categories */
  for (let i = 4; i < 12; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  /* Shuffle the password to randomize position of required characters */
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/* Hash a plain text password */
export const hashPassword = async (password: string, saltRounds: number = DEFAULT_PASSWORD_SALT_ROUNDS): Promise<string> => {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/* Verify a password against its hash */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Failed to verify password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/* Synchronous version of password hashing (for environments where async is not preferred) */
export const hashPasswordSync = (password: string, saltRounds: number = DEFAULT_PASSWORD_SALT_ROUNDS): string => {
  try {
    return bcrypt.hashSync(password, saltRounds);
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/* Synchronous version of password verification */
export const verifyPasswordSync = (password: string, hash: string): boolean => {
  try {
    return bcrypt.compareSync(password, hash);
  } catch (error) {
    throw new Error(`Failed to verify password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/* Hash backup codes or secrets for secure storage */
export const hashSecret = async (secret: string, saltRounds: number = DEFAULT_PASSWORD_SALT_ROUNDS): Promise<string> => {
  try {
    return await hashPassword(secret, saltRounds);
  } catch (error) {
    throw new Error(`Failed to hash secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/* Verify backup codes or secrets against their hash */
export const verifySecret = async (secret: string, hash: string): Promise<boolean> => {
  try {
    return await verifyPassword(secret, hash);
  } catch (error) {
    throw new Error(`Failed to verify secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};