import { ZodSchema } from "zod";
import { PayloadValidationResponse } from '@shared/types';

/* Validates payload against Zod schema and returns standardized validation result */
export function validatePayload<T>(
  rawBody: JSON,
  schema: ZodSchema<T>,
  resourceName: string
): PayloadValidationResponse<T> {
  const validationResult = schema.safeParse(rawBody);

  if (!validationResult.success) {
    return {
      isValid: false,
      errors: validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      })),
      message: `The provided ${resourceName} data is invalid. Please review the errors and try again.`
    };
  }

  return {
    isValid: true,
    data: validationResult.data
  };
}