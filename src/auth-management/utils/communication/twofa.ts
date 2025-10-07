/* Shared module imports */
import { sendGridService } from '@shared/services';
import { getCurrentISOString } from '@shared/utils/time';
import { SENDGRID_EMAIL } from '@shared/constants';
import { EmailParams, EmailResponse } from '@shared/types';

/* Auth management module imports */
import { generateUser2FADisabledHTML, generateUser2FADisabledText, generateUser2FASetupHTML, generateUser2FASetupText } from '@auth-management/email-templates';
import { User2FASetupEmailOptions, User2FADisabledEmailOptions } from '@auth-management/types';

/* Send user 2FA setup email with setup instructions */
export async function sendUser2FASetupEmail(options: User2FASetupEmailOptions): Promise<EmailResponse> {
  const { to, firstName, lastName, email, roleName, twoFactorData } = options;

  try {
    /* Prepare email parameters */
    const emailParams: EmailParams = {
      from: SENDGRID_EMAIL,
      to: to,
      subject: '2FA Enabled - Your Account Security Update',
      html: generateUser2FASetupHTML(firstName, lastName, email, roleName),
      text: generateUser2FASetupText(firstName, lastName, email, roleName),
      headers: {
        'X-Entity-Ref-ID': `user-2fa-setup-${Date.now()}`,
      },
      categories: ['user-2fa-setup'],
    };

    /* Add QR code attachment if 2FA data is provided */
    if (twoFactorData?.qrCodeBuffer) {
      emailParams.attachments = [{
        filename: '2FA-QR-Code.svg',
        content: twoFactorData.qrCodeBuffer.toString('base64'),
        type: 'image/svg+xml',
        disposition: 'attachment'
      }];
    }

    /* Send 2FA setup email with HTML and text content */
    const result = await sendGridService.sendEmail(emailParams);

    if (!result.success) {
      console.error('[2FA-EMAIL] 500: SendGrid user 2FA setup email error', {
        error: result.error,
        timestamp: getCurrentISOString()
      });
      return {
        success: false,
        error: result.error || 'Failed to send email',
        timestamp: getCurrentISOString()
      };
    }

    /* Log successful 2FA setup email delivery */
    console.log('[2FA-EMAIL] 200: User 2FA setup email sent successfully', {
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

    console.error('[2FA-EMAIL] 500: User 2FA setup email delivery service error', {
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

/* Send user 2FA disabled email with removal instructions */
export async function sendUser2FADisabledEmail(options: User2FADisabledEmailOptions): Promise<EmailResponse> {
  const { to, firstName, lastName, email, roleName } = options;

  try {
    /* Prepare email parameters */
    const emailParams: EmailParams = {
      from: SENDGRID_EMAIL,
      to: to,
      subject: '2FA Disabled - Action Required for Your Account',
      html: generateUser2FADisabledHTML(firstName, lastName, email, roleName),
      text: generateUser2FADisabledText(firstName, lastName, email, roleName),
      headers: {
        'X-Entity-Ref-ID': `user-2fa-disabled-${Date.now()}`,
      },
      categories: ['user-2fa-disabled'],
    };

    /* Send 2FA disabled email with HTML and text content */
    const result = await sendGridService.sendEmail(emailParams);

    if (!result.success) {
      console.error('[2FA-EMAIL] 500: SendGrid user 2FA disabled email error', {
        error: result.error,
        timestamp: getCurrentISOString()
      });
      return {
        success: false,
        error: result.error || 'Failed to send email',
        timestamp: getCurrentISOString()
      };
    }

    /* Log successful 2FA disabled email delivery */
    console.log('[2FA-EMAIL] 200: User 2FA disabled email sent successfully', {
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

    console.error('[2FA-EMAIL] 500: User 2FA disabled email delivery service error', {
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
