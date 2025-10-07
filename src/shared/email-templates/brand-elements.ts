/* Brand elements and constants for POS System email templates */

/* Email icons using Unicode symbols */
export const EMAIL_ICONS = {
  WELCOME: '🎉',
  SUCCESS: '🚀',
  USER: '👤',
  SECURITY: '🔐',
  PASSWORD: '🔑',
  ROLE: '👥',
  ERROR: '⚠️',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  CHECKMARK: '✓',
  PROGRESS: '📋',
  COMPANY: '🏢',
  TIME: '⏰',
  SUPPORT: '🆘',
  PHONE: '📞',
  CROSS: '❌',
  GEAR: '⚙️',
  HOURGLASS: '⏳',
  REFRESH: '🔄',
  CLIPBOARD: '📋',
  PACKAGE: '📦',
  LOCK: '🔒',
  SHIELD: '🛡️'
};

/* Company and system information */
export const COMPANY_INFO = {
  COMPANY_NAME: 'Voice POS',
  TEAM_NAME: 'Voice POS Team',
  SUPPORT_EMAIL: 'support@voicepos.com',
  LOGIN_URL: 'https://app.voicepos.com/login',
  WEBSITE: 'https://voicepos.com',
  SUPPORT_TEAM_NAME: 'Voice POS Technical Support Team'
};

/* Common email content */
export const EMAIL_CONTENT = {
  SECURITY_NOTICE: 'Please change your password immediately after first login and never share your credentials with anyone.',
  SUPPORT_AVAILABILITY: 'Available 24/7 to assist you',
  DISCLAIMER: 'This email was sent from an automated system. Please do not reply directly to this email.',
  SUPPORT_CONTACT: `If you have any questions, please don't hesitate to contact our support team.`,
  PRIORITY_ESCALATION: 'Mention "Provisioning Failure" for immediate escalation'
};

/* Generate email header */
export const generateEmailHeader = (title: string, icon: string = EMAIL_ICONS.WELCOME): string => {
  return `
    <div class="header">
      <div class="header-icon">${icon}</div>
      <h1>${title}</h1>
      <h2>${COMPANY_INFO.COMPANY_NAME} System</h2>
    </div>
  `;
};

/* Generate email footer */
export const generateEmailFooter = (): string => {
  return `
    <div class="footer">
      <div class="footer-brand">${COMPANY_INFO.COMPANY_NAME}</div>
      <div class="footer-text">${EMAIL_CONTENT.SUPPORT_AVAILABILITY}</div>
      <div class="footer-text">Email: ${COMPANY_INFO.SUPPORT_EMAIL}</div>
      <div class="footer-text">Website: ${COMPANY_INFO.WEBSITE}</div>
      <div style="margin-top: 20px; font-size: 12px; color: #666;">
        ${EMAIL_CONTENT.DISCLAIMER}
      </div>
    </div>
  `;
};