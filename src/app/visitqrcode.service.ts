import { Injectable } from '@angular/core';
import {
  QRCodeWriter,
  BarcodeFormat,
  BitMatrix,
  EncodeHintType,
} from '@zxing/library';
import { MatSnackBar } from '@angular/material/snack-bar';

// NEW INTERFACE: Specifically for Visit QR Codes
interface VisitQrData {
  id: string; // The visit ID
  name: string; // Visitor's name
  phone: string; // Visitor's phone
  idnum: string; // Visitor's National ID
  licenseplate: string; // Visitor's License Plate
  purpose: string; // Purpose of visit
  host: string; // Host's name
  visitDate: string; // Visit date
  visitTime: string; // Visit time
  status: string; // Visit status
  // Add any other relevant visit-specific data you want in the QR code
}

@Injectable({
  providedIn: 'root',
})
export class VisitQrCodeService {
  // Renamed from QrCodeService to VisitQrService
  private qrWriter = new QRCodeWriter();
  private qrSize: number = 250;
  private qrColorDark = '#1A5276';
  private qrColorLight = '#FFFFFF';

  constructor(private snackBar: MatSnackBar) {}

  // Generates QR code data URL specifically for a visit
  public async generateVisitQrCodeDataUrl(
    visitData: VisitQrData
  ): Promise<string> {
    // Stringify ALL the visit data into the QR code
    const qrData = JSON.stringify(visitData);

    try {
      console.log('Generating QR code data for visit:', qrData);
      const hints = new Map<EncodeHintType, any>();
      hints.set(EncodeHintType.MARGIN, 1);

      const bitMatrix: BitMatrix = this.qrWriter.encode(
        qrData,
        BarcodeFormat.QR_CODE,
        this.qrSize,
        this.qrSize,
        hints
      );

      const canvas = document.createElement('canvas');
      canvas.width = this.qrSize;
      canvas.height = this.qrSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas rendering context.');
      }

      ctx.fillStyle = this.qrColorLight;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = this.qrColorDark;

      for (let x = 0; x < bitMatrix.getWidth(); x++) {
        for (let y = 0; y < bitMatrix.getHeight(); y++) {
          if (bitMatrix.get(x, y)) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      return canvas.toDataURL('image/png');
    } catch (error: any) {
      console.error('Error generating visit QR code:', error);
      let userMessage = 'Failed to generate visit QR code.';
      if (error.message && error.message.includes('WriterException')) {
        userMessage =
          'Error encoding data. Data might be too long for the selected QR code size or contain invalid characters.';
      } else if (error instanceof Error) {
        userMessage = `Failed to generate visit QR code: ${error.message}`;
      }
      this.snackBar.open(userMessage, undefined, {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      throw new Error(userMessage);
    }
  }

  // Downloads QR code specifically for a visit
  public async downloadVisitQrCode(visitData: VisitQrData) {
    console.log(
      'Attempting to generate and download QR code for visit ID:',
      visitData.id
    );
    if (!visitData.id) {
      console.warn(
        'Cannot download visit QR code: Visit data is incomplete.',
        visitData
      );
      this.snackBar.open(
        'Cannot download visit QR code: Visit data is incomplete.',
        undefined,
        { duration: 3000, panelClass: ['error-snackbar'] }
      );
      return;
    }
    try {
      const qrCodeDataUrl = await this.generateVisitQrCodeDataUrl(visitData);
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      const fileName = visitData.name
        ? visitData.name.replace(/\s+/g, '_')
        : visitData.id;
      link.download = `visit_${fileName}_qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.snackBar.open('Visit QR Code download initiated!', undefined, {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
      console.log('Visit QR Code download initiated.');
    } catch (error: any) {
      console.error('Error generating/downloading visit QR code:', error);
      this.snackBar.open(
        `Failed to download visit QR code: ${error.message || 'Unknown error'}`,
        undefined,
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    }
  }
}
