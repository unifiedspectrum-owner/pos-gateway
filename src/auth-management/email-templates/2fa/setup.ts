/* Shared module imports */
import { baseEmailStyles, themeStyles, componentStyles, EMAIL_ICONS, generateEmailHeader, generateEmailFooter, EMAIL_CONTENT, COMPANY_INFO } from '@shared/email-templates';

/* Generate 2FA setup email text content */
export const generateUser2FASetupText = (
  firstName: string,
  lastName: string,
  email: string,
  roleName: string,
): string => {
  return `
    Dear ${firstName} ${lastName},

    Two-Factor Authentication (2FA) has been successfully enabled for your ${COMPANY_INFO.COMPANY_NAME} account for enhanced security.

    Your Account Details:
    • Email: ${email}
    • Role: ${roleName}

    TWO-FACTOR AUTHENTICATION SETUP:
    Your account now requires 2FA for all future logins. Please complete the setup using the following steps:

    Step 1: Install an authenticator app on your mobile device:
    - Google Authenticator (iOS/Android)
    - Microsoft Authenticator (iOS/Android)
    - Authy (iOS/Android)

    Step 2: Complete your 2FA setup:
    - Log into your account to access the setup wizard
    - Scan the QR code or enter the manual key provided in your account
    - Test your setup by entering a verification code

    Next Steps:
    1. Login to your account to complete the 2FA setup
    2. Follow the on-screen instructions to configure your authenticator app
    3. Test the 2FA setup by logging out and logging back in
    4. Contact support if you need assistance

    Login URL: ${COMPANY_INFO.LOGIN_URL}

    If you need help with 2FA setup, our support team is here to assist you:
    • Email: ${COMPANY_INFO.SUPPORT_EMAIL}
    • ${EMAIL_CONTENT.SUPPORT_AVAILABILITY}

    Best regards,
    ${COMPANY_INFO.TEAM_NAME}

    ---
    ${EMAIL_CONTENT.DISCLAIMER}
  `.trim();
}

/* Generate 2FA setup email HTML content */
export const generateUser2FASetupHTML = (
  firstName: string,
  lastName: string,
  email: string,
  roleName: string,
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>2FA Enabled - ${COMPANY_INFO.COMPANY_NAME}</title>
      <style>
        ${baseEmailStyles}
        ${themeStyles.security}

        .header-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        .security-message {
          background: rgba(0, 255, 65, 0.1);
          border: 1px solid #00FF41;
          ${componentStyles.card}
          color: #000000;
          text-align: center;
        }
        .security-message .icon {
          font-size: 24px;
          margin-bottom: 10px;
        }
        .security-message .title {
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 5px;
          color: #000000;
        }
        .account-section {
          background: rgba(0, 255, 65, 0.1);
          border: 2px solid #00FF41;
          ${componentStyles.card}
          text-align: center;
        }
        .account-title {
          font-weight: 700;
          color: #000000;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .account-item {
          margin: 15px 0;
          font-size: 16px;
          color: #000000;
        }
        .account-label {
          font-weight: 600;
          color: #000000;
          display: inline-block;
          width: 120px;
        }
        .account-value {
          ${componentStyles.monospace}
          margin-left: 10px;
          display: inline-block;
        }
        .twofa-section {
          background: rgba(0, 255, 65, 0.1);
          border: 2px solid #00FF41;
          ${componentStyles.card}
          text-align: center;
          margin: 25px 0;
        }
        .twofa-title {
          font-weight: 700;
          color: #000000;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .next-steps {
          background: rgba(0, 255, 65, 0.05);
          border: 1px solid rgba(0, 255, 65, 0.3);
          ${componentStyles.card}
          color: #000000;
        }
        .next-steps .title {
          font-weight: 700;
          margin-bottom: 15px;
          color: #000000;
        }
        .next-steps ol {
          margin: 10px 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          font-size: 14px;
        }
        .login-button {
          ${componentStyles.button}
        }
        .login-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 255, 65, 0.4);
        }
        .button-container {
          text-align: center;
          margin: 35px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${generateEmailHeader('2FA Security Update', EMAIL_ICONS.SECURITY)}

        <div class="content">
          <div class="greeting">Hello ${firstName} ${lastName},</div>

          <div class="security-message">
            <div class="icon">${EMAIL_ICONS.SUCCESS}</div>
            <div class="title">Two-Factor Authentication Enabled!</div>
            <div>Your account security has been enhanced with 2FA protection.</div>
          </div>

          <div class="account-section">
            <div class="account-title">${EMAIL_ICONS.USER} Your Account Details</div>
            <div class="account-item">
              <span class="account-label">Email:</span>
              <span class="account-value">${email}</span>
            </div>
            <div class="account-item">
              <span class="account-label">Role:</span>
              <span style="font-weight: 600; color: #00FF41;">${roleName}</span>
            </div>
          </div>

          <div class="twofa-section">
            <div class="twofa-title">${EMAIL_ICONS.SECURITY} Two-Factor Authentication Setup</div>
            <div>Your account now requires 2FA for all future logins. Please complete the setup using the following steps:</div>

            <div style="margin: 20px 0;">
              <strong>Step 1:</strong> Install an authenticator app on your mobile device:
              <ul style="text-align: left; display: inline-block; margin: 10px 0;">
                <li>Google Authenticator (iOS/Android)</li>
                <li>Microsoft Authenticator (iOS/Android)</li>
                <li>Authy (iOS/Android)</li>
              </ul>
            </div>

            <div style="margin: 20px 0;">
              <strong>Step 2:</strong> Complete your 2FA setup:
              <ul style="text-align: left; display: inline-block; margin: 10px 0;">
                <li>Log into your account to access the setup wizard</li>
                <li>Scan the QR code or enter the manual key provided in your account</li>
                <li>Test your setup by entering a verification code</li>
              </ul>
            </div>

            <div style="font-size: 14px; color: #666; margin-top: 15px;">
              After setup, you'll need to enter a 6-digit code from your authenticator app when logging in.
            </div>
          </div>

          <div class="next-steps">
            <div class="title">${EMAIL_ICONS.PROGRESS} Next Steps</div>
            <ol>
              <li>Login to your account to complete the 2FA setup</li>
              <li>Follow the on-screen instructions to configure your authenticator app</li>
              <li>Test the 2FA setup by logging out and logging back in</li>
              <li>Contact support if you need assistance</li>
            </ol>
          </div>

          <div class="button-container">
            <a href="${COMPANY_INFO.LOGIN_URL}" class="login-button">Login to ${COMPANY_INFO.COMPANY_NAME}</a>
          </div>

          <div class="message">
            If you need help with 2FA setup, our support team is here to assist you at ${COMPANY_INFO.SUPPORT_EMAIL}.
          </div>
        </div>

        ${generateEmailFooter()}
      </div>
    </body>
    </html>
  `;
}