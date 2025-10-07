/* Base CSS styles for POS System email templates */
export const baseEmailStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
    color: #000000;
    margin: 0;
    padding: 0;
    background-color: #1A1A1A;
  }
  .container {
    max-width: 600px;
    margin: 20px auto;
    background: #FFFFFF;
    border-radius: 12px;
    overflow: hidden;
  }
  .header {
    background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%);
    color: #FFFFFF;
    padding: 40px 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.5px;
  }
  .header h2 {
    margin: 10px 0 0 0;
    font-size: 16px;
    font-weight: 400;
    opacity: 0.9;
  }
  .content {
    padding: 40px 30px;
  }
  .greeting {
    font-size: 18px;
    color: #000000;
    margin-bottom: 20px;
    font-weight: 600;
  }
  .message {
    font-size: 16px;
    color: #1A1A1A;
    margin-bottom: 30px;
    line-height: 1.7;
  }
  .footer {
    background: #F5F5F5;
    padding: 30px;
    text-align: center;
  }
  .footer-text {
    color: #1A1A1A;
    font-size: 14px;
    margin: 5px 0;
  }
  .footer-brand {
    color: #000000;
    font-weight: 700;
    margin-bottom: 10px;
    font-size: 16px;
  }
  @media (max-width: 600px) {
    .container {
      margin: 10px;
      border-radius: 8px;
    }
    .header, .content, .footer {
      padding: 25px 20px;
    }
  }
`;

/* Theme-specific styles for different email types */
export const themeStyles = {
  /* Success theme - green accents */
  success: `
    .container {
      box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .header {
      border-bottom: 2px solid #10B981;
    }
    .header h2 {
      color: #10B981;
    }
    .footer {
      border-top: 2px solid #10B981;
    }
  `,

  /* Error theme - red accents */
  error: `
    .container {
      box-shadow: 0 8px 32px rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .header {
      border-bottom: 2px solid #EF4444;
    }
    .header h2 {
      color: #EF4444;
    }
    .footer {
      border-top: 2px solid #EF4444;
    }
  `,

  /* Welcome theme - neon green accents */
  welcome: `
    .container {
      box-shadow: 0 8px 32px rgba(0, 255, 65, 0.15);
      border: 1px solid rgba(0, 255, 65, 0.2);
    }
    .header {
      border-bottom: 2px solid #00FF41;
    }
    .header h2 {
      color: #00FF41;
    }
    .footer {
      border-top: 2px solid #00FF41;
    }
  `,

  /* Security theme - security focused accents */
  security: `
    .container {
      box-shadow: 0 8px 32px rgba(0, 255, 65, 0.15);
      border: 1px solid rgba(0, 255, 65, 0.2);
    }
    .header {
      border-bottom: 2px solid #00FF41;
    }
    .header h2 {
      color: #00FF41;
    }
    .footer {
      border-top: 2px solid #00FF41;
    }
  `,

  /* Default theme - neon green accents */
  default: `
    .container {
      box-shadow: 0 8px 32px rgba(0, 255, 65, 0.15);
      border: 1px solid rgba(0, 255, 65, 0.2);
    }
    .header {
      border-bottom: 2px solid #00FF41;
    }
    .header h2 {
      color: #00FF41;
    }
    .footer {
      border-top: 2px solid #00FF41;
    }
  `
};

/* Common component styles */
export const componentStyles = {
  /* Card-style containers */
  card: `
    border-radius: 8px;
    padding: 20px;
    margin: 25px 0;
  `,

  /* Alert boxes */
  alertBox: `
    border-radius: 8px;
    padding: 15px;
    margin: 25px 0;
    font-size: 14px;
    text-align: center;
  `,

  /* Feature list items */
  featureItem: `
    margin: 8px 0;
    font-size: 14px;
    color: #1A1A1A;
    display: flex;
    align-items: center;
  `,

  /* Buttons */
  button: `
    display: inline-block;
    padding: 16px 32px;
    background: linear-gradient(135deg, #00FF41 0%, #10B981 100%);
    color: #000000;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 16px;
    transition: all 0.3s ease;
    margin: 20px 0;
    box-shadow: 0 4px 16px rgba(0, 255, 65, 0.3);
  `,

  /* Monospace text (for codes, credentials) */
  monospace: `
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-weight: bold;
    color: #00FF41;
    background: #000000;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #00FF41;
  `
};