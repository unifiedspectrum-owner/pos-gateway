/* Shared module imports */
import { baseEmailStyles, themeStyles, componentStyles, EMAIL_ICONS, generateEmailHeader, generateEmailFooter, EMAIL_CONTENT, COMPANY_INFO } from '@shared/email-templates';

/* Generate plain text version of password reset email */
export const generatePasswordResetText = (resetToken: string, userEmail: string, userName: string, resetUrl: string): string => {
  return `
    Password Reset Request - Voice POS

    Hello ${userName},

    We received a request to reset the password for your Voice POS account (${userEmail}).

    To reset your password, copy and paste the following link into your web browser:
    ${resetUrl}?token=${resetToken}

    This link will expire in 1 hour for security reasons.

    If you did not request a password reset, please ignore this email. Your password will remain unchanged.

    For security reasons, we recommend:
    - Never sharing your password reset link with others
    - Using a strong, unique password for your Voice POS account
    - Contacting support if you have any concerns

    Voice POS Security Team
  `.trim();
};

/* Generate HTML version of password reset email with Voice POS branding */
export const generatePasswordResetHTML = (resetToken: string, userEmail: string, userName: string, resetUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Voice POS Password</title>
      <style>
        ${baseEmailStyles}
        ${themeStyles.default}

        .reset-container {
          background: #F5F5F5;
          border: 2px solid #00FF41;
          ${componentStyles.card}
          text-align: center;
        }
        .reset-title {
          font-size: 18px;
          font-weight: 700;
          color: #000000;
          margin-bottom: 15px;
        }
        .reset-button {
          display: inline-block;
          background-color: #00FF41 !important;
          color: #000000 !important;
          padding: 15px 30px !important;
          text-decoration: none !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          font-size: 16px !important;
          margin: 20px 0 !important;
          border: 2px solid #000000 !important;
          font-family: Arial, sans-serif !important;
        }
        .reset-button:hover {
          background-color: #000000 !important;
          color: #00FF41 !important;
        }
        .expiry-notice {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid #F59E0B;
          ${componentStyles.alertBox}
          color: #000000;
        }
        .security-notice {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid #10B981;
          ${componentStyles.alertBox}
          color: #000000;
          margin-top: 20px;
        }
        .account-info {
          background: rgba(0, 0, 0, 0.05);
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #000000;
        }
        .header-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${generateEmailHeader('Password Reset Request', EMAIL_ICONS.SECURITY)}

        <div class="content">
          <div class="message">
            Hello ${userName},<br><br>
            We received a request to reset the password for your Voice POS account.
          </div>

          <div class="account-info">
            <strong>Account:</strong> ${userEmail}
          </div>

          <div class="reset-container">
            <div class="reset-title">Reset Your Password</div>
            <a href="${resetUrl}?token=${resetToken}" class="reset-button" target="_blank" rel="noopener noreferrer">
              ${EMAIL_ICONS.LOCK} Reset Password
            </a>
          </div>

          <div class="expiry-notice">
            <strong>${EMAIL_ICONS.TIME} Important:</strong> This password reset link will expire in 1 hour for security reasons.
            If you didn't request this reset, please ignore this email.
          </div>

          <div class="security-notice">
            <strong>${EMAIL_ICONS.SHIELD} Security Tips:</strong>
            <ul style="text-align: left; margin: 10px 0;">
              <li>Never share your password reset link with others</li>
              <li>Use a strong, unique password for your Voice POS account</li>
              <li>Contact support if you have any security concerns</li>
            </ul>
          </div>
        </div>

        ${generateEmailFooter()}
      </div>
    </body>
    </html>
  `;
};