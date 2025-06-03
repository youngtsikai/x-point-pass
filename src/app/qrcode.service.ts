import { Injectable } from '@angular/core';
import {
  QRCodeWriter,
  BarcodeFormat,
  BitMatrix,
  EncodeHintType,
} from '@zxing/library';
import { MatSnackBar } from '@angular/material/snack-bar';

interface QrUserData {
  uid: string;
  name: string;
  role: string;
  phoneNumber?: string | null; // Corrected: changed 'phone' to 'phoneNumber'
}

@Injectable({
  providedIn: 'root',
})
export class QrCodeService {
  private qrWriter = new QRCodeWriter();
  private qrSize: number = 250;
  private qrColorDark = '#1A5276';
  private qrColorLight = '#FFFFFF';

  constructor(private snackBar: MatSnackBar) {}

  public async generateQrCodeDataUrl(userData: QrUserData): Promise<string> {
    // Log the user data as it's received by this method
    console.log('User data received by generateQrCodeDataUrl:', userData);

    // Construct the data for the QR code, now correctly using 'phoneNumber'
    const qrData = JSON.stringify({
      uid: userData.uid || 'N/A',
      name: userData.name || 'N/A',
      role: userData.role || 'N/A',
      // Access 'phoneNumber' property directly, as per the updated interface
      phone: userData.phoneNumber || 'N/A',
    });

    try {
      // Log the final JSON string that will be encoded into the QR code
      console.log('Generating QR code data for:', qrData);

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
      console.error('Error generating QR code:', error);
      let userMessage = 'Failed to generate QR code.';
      if (error.message && error.message.includes('WriterException')) {
        userMessage =
          'Error encoding data. Data might be too long for the selected QR code size or contain invalid characters.';
      } else if (error instanceof Error) {
        userMessage = `Failed to generate QR code: ${error.message}`;
      }
      this.snackBar.open(userMessage, undefined, {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      throw new Error(userMessage);
    }
  }

  public async downloadQrCode(userData: QrUserData) {
    console.log(
      'Attempting to generate and download QR code for user:',
      userData.uid
    );
    if (!userData.uid) {
      console.warn(
        'Cannot download QR code: User data is incomplete.',
        userData
      );
      this.snackBar.open(
        'Cannot download QR code: User data is incomplete.',
        undefined,
        { duration: 3000, panelClass: ['error-snackbar'] }
      );
      return;
    }
    try {
      const qrCodeDataUrl = await this.generateQrCodeDataUrl(userData);
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      const fileName = userData.name
        ? userData.name.replace(/\s+/g, '_')
        : userData.uid;
      link.download = `user_${fileName}_qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.snackBar.open('QR Code download initiated!', undefined, {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
      console.log('QR Code download initiated.');
    } catch (error: any) {
      console.error('Error generating/downloading QR code:', error);
      this.snackBar.open(
        `Failed to download QR code: ${error.message || 'Unknown error'}`,
        undefined,
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    }
  }

  public async printQrCode(userData: QrUserData) {
    console.log(
      'Attempting to generate and print QR code for user:',
      userData.uid
    );
    if (!userData.uid) {
      console.warn('Cannot print QR code: User data is incomplete.', userData);
      this.snackBar.open(
        'Cannot print QR code: User data is incomplete.',
        undefined,
        { duration: 3000, panelClass: ['error-snackbar'] }
      );
      return;
    }
    try {
      const qrCodeDataUrl = await this.generateQrCodeDataUrl(userData);
      const printWindow = window.open('', '_blank', 'width=400,height=400');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
           <html>
              <head>
                <title>Print User QR Code - ${
                  userData.name || userData.uid
                }</title>
                <style>
                  body {
                     display: flex;
                     justify-content: center;
                     align-items: center;
                     min-height: 100vh;
                     margin: 0;
                     background-color: ${this.qrColorLight};
                  }
                  img {
                     max-width: 90%;
                     max-height: 90vh;
                     object-fit: contain;
                  }
                  @media print {
                     body { background-color: white !important; }
                     img { max-width: 100%; max-height: none; }
                  }
                </style>
              </head>
              <body>
                <img src="${qrCodeDataUrl}" alt="User QR Code for ${
          userData.name || userData.uid
        }">
                <script>
                  const img = document.querySelector('img');
                  if (img && img.complete) {
                     window.print();
                     window.onafterprint = function() { window.close(); }
                  } else if (img) {
                     img.onload = function() {
                       window.print();
                       window.onafterprint = function() { window.close(); }
                     }
                  } else {
                     window.print();
                     window.onafterprint = function() { window.close(); }
                  }
                </script>
              </body>
            </html>
          `);
        printWindow.document.close();
        this.snackBar.open('QR Code print initiated!', undefined, {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
      } else {
        this.snackBar.open(
          'Failed to open print window. Please check your browser settings and pop-up blockers.',
          undefined,
          {
            duration: 5000,
            panelClass: ['error-snackbar'],
          }
        );
      }
    } catch (error: any) {
      console.error('Error generating/printing QR code:', error);
      this.snackBar.open(
        `Failed to print QR code: ${error.message || 'Unknown error'}`,
        undefined,
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    }
  }
}
