/* Shared module imports */
import { sendGridService } from '@shared/services';
import { getCurrentISOString } from '@shared/utils/time';
import { EMAIL_QUEUE_PREFIX, FRONTEND_APP_URL, SENDGRID_EMAIL } from '@shared/constants';
import { EmailParams, EmailResponse } from '@shared/types';

/* Auth management module imports */
import { generatePasswordResetHTML, generatePasswordResetText, generatePasswordChangedConfirmationHTML, generatePasswordChangedConfirmationText } from '@auth-management/email-templates';
import { PasswordResetOptions, PasswordResetConfirmationOptions } from '@auth-management/types';
import { CommunicationQueueMessage } from '@shared/types/queue';
import { generateUniqueID } from '@shared/utils/id-generation';

/* Send password reset email with reset link */
export async function sendPasswordResetEmail(options: PasswordResetOptions, env: Env): Promise<EmailResponse> {
  const { to, userEmail, userName, resetToken } = options;

  try {
    /* Construct reset URL using base URL from company info */
    const resetUrl = `${FRONTEND_APP_URL}/auth/reset-password`;

    /* Send password reset email with HTML and text content */
    const emailParams: EmailParams = {
      from: SENDGRID_EMAIL,
      to: to,
      subject: 'Reset Your Voice POS Password',
      html: generatePasswordResetHTML(resetToken, userEmail, userName, resetUrl),
      text: generatePasswordResetText(resetToken, userEmail, userName, resetUrl),
      headers: {
        'X-Entity-Ref-ID': `password-reset-${Date.now()}`,
      },
      categories: ['password-reset'],
    };

    /* Prepare queue message */
    const queueMessage: CommunicationQueueMessage = {
      request_id: generateUniqueID(EMAIL_QUEUE_PREFIX),
      params: emailParams
    };

    /* Send to queue */
    env.COMMUNICATION_QUEUE.send(queueMessage);

    /* Log successful password reset email delivery */
    console.log('[PASSWORD-EMAIL] 200: Password reset email sent successfully', {
      to,
      requestId: queueMessage.request_id,
      timestamp: getCurrentISOString()
    });

    return {
      success: true,
      messageId: queueMessage.request_id,
      timestamp: getCurrentISOString()
    };

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('[PASSWORD-EMAIL] 500: Password reset email delivery service error', {
      error: errorMessage,
      to,
      timestamp: getCurrentISOString()
    });

    return {
      success: false,
      error: errorMessage,
      timestamp: getCurrentISOString()
    };
  }
}

/* Send password reset confirmation email after successful password change */
export async function sendPasswordResetConfirmationEmail(options: PasswordResetConfirmationOptions, env: Env): Promise<EmailResponse> {
  const { to, userName, resetTime, ipAddress } = options;

  try {
    /* Send password reset confirmation email with HTML and text content */
    const emailParams: EmailParams = {
      from: SENDGRID_EMAIL,
      to: to,
      subject: 'Password Successfully Reset - Voice POS',
      html: generatePasswordChangedConfirmationHTML(userName, resetTime, ipAddress),
      text: generatePasswordChangedConfirmationText(userName, resetTime, ipAddress),
      headers: {
        'X-Entity-Ref-ID': `password-confirmation-${Date.now()}`,
      },
      categories: ['password-confirmation', 'security-notification'],
    };

    /* Prepare queue message */
    const queueMessage: CommunicationQueueMessage = {
      request_id: generateUniqueID(EMAIL_QUEUE_PREFIX),
      params: emailParams
    };

    /* Send to queue */
    env.COMMUNICATION_QUEUE.send(queueMessage);

    /* Log successful password confirmation email delivery */
    console.log('[PASSWORD-EMAIL] 200: Password reset confirmation email sent successfully', {
      to,
      requestId: queueMessage.request_id,
      timestamp: getCurrentISOString()
    });

    return {
      success: true,
      messageId: queueMessage.request_id,
      timestamp: getCurrentISOString()
    };

  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('[PASSWORD-EMAIL] 500: Password reset confirmation email service error', {
      error: errorMessage,
      to,
      timestamp: getCurrentISOString()
    });

    return {
      success: false,
      error: errorMessage,
      timestamp: getCurrentISOString()
    };
  }
}
