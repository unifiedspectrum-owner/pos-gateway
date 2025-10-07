/* Phone Number Validation */
export const PHONE_NUMBER_REG_EXP = /^\+?[1-9]\d{1,4}-?\d{1,14}$/;
export const PHONE_NUMBER_ALT_REG_EXP = /^\+\d{1,4}-\d{4,15}$/;
export const PHONE_NUMBER_MIN_LENGTH = 10;
export const PHONE_NUMBER_MAX_LENGTH = 15;

/* OTP Configuration */
export const OTP_MIN_VALUE = 100000; // 6-digit minimum
export const OTP_MAX_VALUE = 999999; // 6-digit maximum
