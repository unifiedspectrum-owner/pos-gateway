/* TypeScript interfaces for validation data structures */

/* Individual field validation error information */
export interface PayloadValidationError {
  field: string;
  message: string;
}

/* Generic payload validation response with optional validated data */
export interface PayloadValidationResponse<T> { 
  isValid: boolean; 
  data?: T, 
  errors?: PayloadValidationError[]; 
  message?: string 
}

/* Generic validation operation result */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/* Country and state validation result with detailed errors */
export interface CountryStateValidationResult {
  isValid: boolean;
  errors?: PayloadValidationError[];
  message?: string;
}