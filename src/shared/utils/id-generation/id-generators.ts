/* Libraries imports */
import { v4 as uuidv4 } from 'uuid';

/* Generate UUID v4 (random) */
export const generateUUID = (): string => {
  return uuidv4();
};

/* Generate unique ID with prefix for tracking */
export const generateUniqueID = (prefix: string): string => {
  return `${prefix}-${uuidv4()}`;
};