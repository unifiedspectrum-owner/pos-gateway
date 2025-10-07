/* Libraries imports */
import sgMail from '@sendgrid/mail';

/* Shared module imports */
import { configService } from '@shared/services';
import { EmailParams, EmailResponse } from '@shared/types';
import { getCurrentISOString } from '@shared/utils';

/* SendGrid email service for transactional email delivery */
export class SendGridService {
  private isInitialized: boolean = false; /* Track SendGrid client initialization state */

  /* Configure SendGrid client with API key from config service */
  private async initializeClient(): Promise<void> {
    if (!this.isInitialized) {
      const sendgridApiKey = await configService.getSendgridApiKey();
      sgMail.setApiKey(sendgridApiKey);
      this.isInitialized = true;
    }
  }

  /* Send transactional email through SendGrid service */
  async sendEmail(params: EmailParams): Promise<EmailResponse> {
    try {
      await this.initializeClient();

      const result = await sgMail.send(params);

      if (!result || !result[0]) {
        return {
          success: false,
          error: 'No response received from email service'
        };
      }

      const messageId = result[0].headers['x-message-id'];
      return {
        success: true,
        messageId
      };
    } catch (error) {
      /* Log error details for debugging */
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      console.error('[SENDGRID-EMAIL] 500: SendGrid email service error', {
        error: errorMessage,
        timestamp: getCurrentISOString()
      });
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /* Reset initialization state for cleanup */
  public destroy(): void {
    this.isInitialized = false;
  }
}

/* Singleton instance for multi-tenant email operations */
export const sendGridService = new SendGridService();
