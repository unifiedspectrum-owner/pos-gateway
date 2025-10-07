/* TypeScript interfaces for communication service data structures */

/* Email attachment structure */
export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded string for SendGrid
  type: string;
  disposition?: string;
}

/* Email message composition parameters */
export interface EmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  categories?: string[];
  attachments?: EmailAttachment[];
}

/* Email sending operation response structure */
export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp?: string
}

/* SMS message request parameters */
export interface SMSParams {
  message: string,
  to: string
}

/* SMS operation response structure */
export interface SMSResponse {
  success: boolean;
  messageSid?: string;
  error?: string;
  timestamp?: string
}