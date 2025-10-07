/* Libraries imports */

/* Shared module imports */
import { baseEmailStyles, themeStyles, componentStyles, EMAIL_ICONS, generateEmailHeader, generateEmailFooter, EMAIL_CONTENT, COMPANY_INFO } from '@shared/email-templates';

/* Generate plain text version of password reset confirmation email */
export const generatePasswordChangedConfirmationText = (userName: string, resetTime: string, ipAddress?: string): string => {
  return `
    Dear ${userName},

    Your ${COMPANY_INFO.COMPANY_NAME} account password has been successfully reset.

    Reset Details:
    • Date & Time: ${resetTime}${ipAddress ? `\n• IP Address: ${ipAddress}` : ''}

    Your account is now secure with your new password.

    IMPORTANT SECURITY NOTICE:
    If you did not make this change, please contact our support team immediately:
    • Email: ${COMPANY_INFO.SUPPORT_EMAIL}
    • Visit: ${COMPANY_INFO.WEBSITE}

    For your security, we recommend:
    • Use a strong, unique password
    • Enable two-factor authentication if available
    • Review your account activity regularly
    • Keep your login credentials secure

    Best regards,
    ${COMPANY_INFO.SUPPORT_TEAM_NAME}

    ---
    ${EMAIL_CONTENT.DISCLAIMER}
  `.trim();
}

/* Generate HTML version of password reset confirmation email with Voice POS branding */
export const generatePasswordChangedConfirmationHTML = (userName: string, resetTime: string, ipAddress?: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Successfully Reset - ${COMPANY_INFO.COMPANY_NAME}</title>
      <style>
        ${baseEmailStyles}
        ${themeStyles.success}

        .success-message {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid #10B981;
          ${componentStyles.card}
          text-align: center;
          color: #000000;
        }
        .success-icon {
          font-size: 24px;
          margin-bottom: 10px;
        }
        .success-title {
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 5px;
          color: #000000;
        }
        .details-section {
          background: #F5F5F5;
          border: 1px solid rgba(16, 185, 129, 0.2);
          ${componentStyles.card}
        }
        .details-title {
          font-weight: 700;
          color: #000000;
          margin-bottom: 15px;
          font-size: 16px;
        }
        .detail-item {
          ${componentStyles.featureItem}
        }
        .detail-label {
          font-weight: 600;
          color: #000000;
          margin-right: 8px;
        }
        .security-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #EF4444;
          ${componentStyles.card}
          color: #000000;
        }
        .security-title {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 10px;
          color: #000000;
        }
        .contact-info {
          margin: 10px 0;
          font-size: 14px;
        }
        .contact-info strong {
          color: #000000;
          font-weight: 700;
        }
        .recommendations {
          background: rgba(0, 255, 65, 0.05);
          border: 1px solid rgba(0, 255, 65, 0.3);
          ${componentStyles.card}
          color: #000000;
        }
        .recommendations-title {
          font-weight: 700;
          margin-bottom: 15px;
          color: #000000;
        }
        .recommendations ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .recommendations li {
          margin: 5px 0;
          font-size: 14px;
        }
        .header-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${generateEmailHeader('Password Successfully Reset', EMAIL_ICONS.LOCK)}

        <div class="content">
          <div class="greeting">Hello ${userName},</div>

          <div class="success-message">
            <div class="success-icon">${EMAIL_ICONS.CHECKMARK}</div>
            <div class="success-title">Password Reset Successful</div>
            <div>Your ${COMPANY_INFO.COMPANY_NAME} account password has been successfully updated.</div>
          </div>

          <div class="details-section">
            <div class="details-title">${EMAIL_ICONS.TIME} Reset Details</div>
            <div class="detail-item">
              <span class="detail-label">Date & Time:</span> ${resetTime}
            </div>
            ${ipAddress ? `<div class="detail-item"><span class="detail-label">IP Address:</span> ${ipAddress}</div>` : ''}
          </div>

          <div class="message">
            Your account is now secure with your new password. You can immediately start using your new password to access your ${COMPANY_INFO.COMPANY_NAME} account.
          </div>

          <div class="security-alert">
            <div class="security-title">${EMAIL_ICONS.ERROR} Security Notice</div>
            <div>
              If you did not make this change, please contact our support team immediately:
            </div>
            <div class="contact-info">
              <strong>Email:</strong> ${COMPANY_INFO.SUPPORT_EMAIL}<br>
              <strong>Website:</strong> ${COMPANY_INFO.WEBSITE}
            </div>
          </div>

          <div class="recommendations">
            <div class="recommendations-title">${EMAIL_ICONS.SHIELD} Security Recommendations</div>
            <ul>
              <li>Use a strong, unique password for your account</li>
              <li>Enable two-factor authentication if available</li>
              <li>Review your account activity regularly</li>
              <li>Keep your login credentials secure and private</li>
              <li>Never share your password with anyone</li>
            </ul>
          </div>

          <div class="message">
            ${EMAIL_CONTENT.SUPPORT_CONTACT}
          </div>
        </div>

        ${generateEmailFooter()}
      </div>
    </body>
    </html>
  `;
}