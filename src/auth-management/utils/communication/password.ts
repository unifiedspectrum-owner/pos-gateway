/* Shared module imports */
import { sendGridService } from '@shared/services';
import { getCurrentISOString } from '@shared/utils/time';
import { FRONTEND_APP_URL, SENDGRID_EMAIL } from '@shared/constants';
import { EmailResponse } from '@shared/types';

/* Auth management module imports */
import { generatePasswordResetHTML, generatePasswordResetText, generatePasswordChangedConfirmationHTML, generatePasswordChangedConfirmationText } from '@auth-management/email-templates';
import { PasswordResetOptions, PasswordResetConfirmationOptions } from '@auth-management/types';

/* Send password reset email with reset link */
export async function sendPasswordResetEmail(options: PasswordResetOptions): Promise<EmailResponse> {
  const { to, userEmail, userName, resetToken } = options;

  try {
    /* Construct reset URL using base URL from company info */
    const resetUrl = `${FRONTEND_APP_URL}/auth/reset-password`;

    /* Send password reset email with HTML and text content */
    const result = await sendGridService.sendEmail({
      from: SENDGRID_EMAIL,
      to: to,
      subject: 'Reset Your Voice POS Password',
      html: generatePasswordResetHTML(resetToken, userEmail, userName, resetUrl),
      text: generatePasswordResetText(resetToken, userEmail, userName, resetUrl),
      headers: {
        'X-Entity-Ref-ID': `password-reset-${Date.now()}`,
      },
      categories: ['password-reset'],
    });

    if (!result.success) {
      console.error('[PASSWORD-EMAIL] 500: SendGrid password reset email error', {
        error: result.error,
        timestamp: getCurrentISOString()
      });
      return {
        success: false,
        error: result.error || 'Failed to send email',
        timestamp: getCurrentISOString()
      };
    }

    /* Log successful password reset email delivery */
    console.log('[PASSWORD-EMAIL] 200: Password reset email sent successfully', {
      to,
      messageId: result.messageId,
      timestamp: getCurrentISOString()
    });

    return {
      success: true,
      messageId: result.messageId,
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
export async function sendPasswordResetConfirmationEmail(options: PasswordResetConfirmationOptions): Promise<EmailResponse> {
  const { to, userName, resetTime, ipAddress } = options;

  try {
    /* Send password reset confirmation email with HTML and text content */
    const result = await sendGridService.sendEmail({
      from: SENDGRID_EMAIL,
      to: to,
      subject: 'Password Successfully Reset - Voice POS',
      html: generatePasswordChangedConfirmationHTML(userName, resetTime, ipAddress),
      text: generatePasswordChangedConfirmationText(userName, resetTime, ipAddress),
      headers: {
        'X-Entity-Ref-ID': `password-confirmation-${Date.now()}`,
      },
      categories: ['password-confirmation', 'security-notification'],
    });

    if (!result.success) {
      console.error('[PASSWORD-EMAIL] 500: SendGrid password confirmation email error', {
        error: result.error,
        timestamp: getCurrentISOString()
      });
      return {
        success: false,
        error: result.error || 'Failed to send confirmation email',
        timestamp: getCurrentISOString()
      };
    }

    /* Log successful password confirmation email delivery */
    console.log('[PASSWORD-EMAIL] 200: Password reset confirmation email sent successfully', {
      to,
      messageId: result.messageId,
      timestamp: getCurrentISOString()
    });

    return {
      success: true,
      messageId: result.messageId,
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
