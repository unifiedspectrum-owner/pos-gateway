/* Libraries imports */
import QRCode from 'qrcode';

/* Generate QR code as base64 data URL */
export const generateQRCodeDataURL = async (text: string): Promise<string> => {
  try {
    /* Generate QR code as SVG string first */
    const qrCodeSVG = await QRCode.toString(text, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    /* Convert SVG to base64 data URL */
    const base64String = Buffer.from(qrCodeSVG).toString('base64');
    const dataURL = `data:image/svg+xml;base64,${base64String}`;

    return dataURL;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/* Generate QR code as buffer for email attachment */
export const generateQRCodeBuffer = async (text: string): Promise<Buffer> => {
  try {
    /* Generate QR code as SVG string for server environment compatibility */
    const qrCodeSVG = await QRCode.toString(text, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    /* Convert SVG string to buffer */
    const buffer = Buffer.from(qrCodeSVG, 'utf8');
    return buffer;
  } catch (error) {
    throw new Error(`Failed to generate QR code buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};