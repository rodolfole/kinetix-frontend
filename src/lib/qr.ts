import QRCode from 'qrcode';

export interface QROptions {
  size?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
}

/**
 * Generate QR code as base64 data URL
 * @param data - Data to encode in the QR code
 * @param options - Optional configuration
 * @returns Base64 data URL of the QR code image
 */
export async function generateQR(
  data: string,
  options: QROptions = {}
): Promise<string> {
  const {
    size = 300,
    margin = 2,
    color = { dark: '#000000', light: '#ffffff' }
  } = options;

  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: size,
      margin,
      color: {
        dark: color.dark,
        light: color.light,
      },
      errorCorrectionLevel: 'M',
    });

    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as SVG string
 * @param data - Data to encode in the QR code
 * @param options - Optional configuration
 * @returns SVG string of the QR code
 */
export async function generateQRSVG(
  data: string,
  options: { size?: number; margin?: number } = {}
): Promise<string> {
  const { size = 300, margin = 2 } = options;

  try {
    const svg = await QRCode.toString(data, {
      type: 'svg',
      margin,
    });

    return svg;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Validate if a string can be encoded in a QR code
 * @param data - String to validate
 * @returns Boolean indicating if the data is valid for QR encoding
 */
export function validateQRData(data: string): boolean {
  if (!data || data.length === 0) return false;
  
  // QR codes have a maximum capacity depending on the data type
  // For alphanumeric: ~4,296 characters
  // For byte mode: ~2,953 bytes
  // We'll use a conservative limit of 2000 characters
  if (data.length > 2000) return false;
  
  return true;
}
