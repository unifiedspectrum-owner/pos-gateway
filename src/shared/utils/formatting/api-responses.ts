/* Shared module imports */
import { PayloadValidationError } from "@shared/types";
import { getCurrentISOString } from "@shared/utils/time";

/* Standard API response structure for all endpoints */
export interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
  validation_errors?: PayloadValidationError[];
  count?: number;
  timestamp: string;
}

/* Create standardized success response with optional count */
export const createSuccessResponse = (message: string, count?: number): ApiResponse => {
  const response = {
    success: true,
    message,
    count,
    timestamp: getCurrentISOString(),
  };

  return response;
};

/* Create standardized error response with optional validation errors */
export const createErrorResponse = (
  message: string,
  error: string,
  validationErrors?: Array<{ field: string; message: string }>
): ApiResponse => {
  const response = {
    success: false,
    message,
    error,
    ...(validationErrors && { validation_errors: validationErrors }),
    timestamp: getCurrentISOString(),
  };

  return response;
};