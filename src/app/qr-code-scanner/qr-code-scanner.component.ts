import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Subscription,
  interval,
  switchMap,
  takeUntil,
  Subject,
  timer,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from '@angular/fire/firestore';

interface ScanResponse {
  message: string;
  data: string | null;
  status: string;
}

@Component({
  selector: 'app-qr-code-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-code-scanner.component.html',
  styleUrls: ['./qr-code-scanner.component.css'],
})
export class QrCodeScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef;
  scannedResult: { [key: string]: string } | null = null;
  errorMessage: string | null = null;
  isScanning = false;
  isVerifying = false;
  private scanIntervalSubscription: Subscription | undefined;
  private qrApiUrl = 'http://localhost:5000/scan_qr';
  private stream: MediaStream | null = null;
  private stopScanningSubject = new Subject<void>();
  public hasScannedSuccessfully = false;
  private metadataLoaded = false;
  processingCheckin = false;
  checkinSuccessful = false;
  checkinMessage: string = '';
  private firestore: Firestore = inject(Firestore);
  private scanTimeout: any;
  backendDecodeError: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  async startScanning(): Promise<void> {
    this.isScanning = true;
    this.scannedResult = null;
    this.errorMessage = null;
    this.hasScannedSuccessfully = false;
    this.stopScanningSubject.next();
    this.metadataLoaded = false;
    this.processingCheckin = false;
    this.checkinSuccessful = false;
    this.checkinMessage = '';
    this.backendDecodeError = null;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.nativeElement.srcObject = this.stream;

      this.videoElement.nativeElement.onloadedmetadata = () => {
        if (!this.metadataLoaded) {
          this.metadataLoaded = true;
          this.videoElement.nativeElement.play();

          timer(500)
            .pipe(takeUntil(this.stopScanningSubject))
            .subscribe(() => {
              this.scanIntervalSubscription = interval(500)
                .pipe(
                  takeUntil(this.stopScanningSubject),
                  switchMap(() => this.captureAndScan())
                )
                .subscribe({
                  next: async (response) => {
                    if (
                      response &&
                      response.status === 'success' &&
                      response.data
                    ) {
                      this.isScanning = false;
                      this.stopCamera();
                      clearTimeout(this.scanTimeout);
                      console.log('Raw QR Code Data:', response.data);
                      const parsedData = this.parseQrData(response.data);
                      console.log('Parsed QR Code Data:', parsedData);
                      this.scannedResult = parsedData;
                      this.hasScannedSuccessfully = true;
                      this.isVerifying = true;
                      await this.verifyAndCheckinStaff(parsedData);
                      this.stopScanningSubject.next();
                    } else if (response?.status === 'error') {
                      console.warn(
                        'Backend reported QR decode error:',
                        response.message
                      );

                      this.backendDecodeError = 'Failed to decode QR code.';
                    }
                  },
                  error: (error) => {
                    this.isScanning = false;
                    this.stopCamera();
                    this.errorMessage = 'Failed to connect to the backend API.';
                    console.error('Error scanning QR code:', error);
                    this.stopScanningSubject.next();
                  },
                  complete: () => {
                    if (
                      !this.hasScannedSuccessfully &&
                      !this.errorMessage &&
                      this.isScanning &&
                      this.backendDecodeError
                    ) {
                      this.isScanning = false;
                      this.stopCamera();
                      this.errorMessage = this.backendDecodeError;
                    } else if (
                      !this.hasScannedSuccessfully &&
                      !this.errorMessage &&
                      this.isScanning
                    ) {
                      this.isScanning = false;
                      this.stopCamera();
                      this.errorMessage =
                        'No valid QR code found within the scanning period.';
                    }
                  },
                });

              this.scanTimeout = setTimeout(() => {
                if (this.isScanning && !this.hasScannedSuccessfully) {
                  this.stopScanningSubject.next();
                  this.isScanning = false;
                  this.stopCamera();
                  this.errorMessage =
                    'No valid QR code found within the scanning period.';
                }
              }, 10000);
            });
        }
      };
    } catch (error) {
      this.isScanning = false;
      this.errorMessage = 'Error accessing camera.';
      console.error('Error accessing camera:', error);
    }
  }

  captureAndScan() {
    return new Promise<ScanResponse | null>((resolve) => {
      if (!this.videoElement?.nativeElement) {
        resolve(null);
        return;
      }
      const videoElement = this.videoElement.nativeElement;

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const formData = new FormData();
              formData.append('image', blob);
              this.http
                .post<ScanResponse>(this.qrApiUrl, formData)
                .subscribe(resolve);
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          0.8
        );
      } else {
        resolve(null);
      }
    });
  }

  parseQrData(data: string): { [key: string]: string } {
    const lines = data.split('\n');
    const result: { [key: string]: string } = {};
    for (const line of lines) {
      const parts = line.split(': ');
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();
        result[key.toUpperCase()] = value; // Store keys in uppercase
      }
    }
    return result;
  }

  async verifyAndCheckinStaff(staffData: { [key: string]: string }) {
    this.processingCheckin = true;
    if (
      !staffData['NAME'] ||
      !staffData['ROLE'] ||
      !staffData['PHONE'] ||
      !staffData['UID']
    ) {
      this.errorMessage = 'Incomplete QR code data for verification.';
      this.processingCheckin = false;
      this.isVerifying = false;
      return;
    }

    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('uid', '==', staffData['UID']));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        if (
          userDoc['name']?.toUpperCase() === staffData['NAME']?.toUpperCase() &&
          userDoc['role']?.toUpperCase() === staffData['ROLE']?.toUpperCase() &&
          userDoc['phoneNumber'] === staffData['PHONE']
        ) {
          await this.recordCheckinFirestore(staffData);
        } else {
          this.errorMessage = 'QR code data does not match user record.';
        }
      } else {
        this.errorMessage = 'User not found.';
      }
    } catch (error: any) {
      this.errorMessage = `Firestore error: ${error.message}`;
    } finally {
      this.processingCheckin = false;
      this.isVerifying = false; // Stop verifying
    }
  }

  async recordCheckinFirestore(staffData: { [key: string]: string }) {
    try {
      const checkinsRef = collection(this.firestore, 'checkin_records');
      await addDoc(checkinsRef, {
        name: staffData['NAME'],
        role: staffData['ROLE'],
        checkin_time: new Date(),
        checkin_status: true,
      });
      this.checkinSuccessful = true;
      this.checkinMessage = 'Check-in successful!';
      this.scannedResult = null;
    } catch (error: any) {
      this.errorMessage = `Firestore record error: ${error.message}`;
    } finally {
      this.processingCheckin = false;
    }
  }

  get scannedResultKeys(): string[] {
    return this.scannedResult ? Object.keys(this.scannedResult) : [];
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  ngOnDestroy(): void {
    if (this.scanIntervalSubscription) {
      this.scanIntervalSubscription.unsubscribe();
    }
    this.stopCamera();
    this.stopScanningSubject.next();
    this.stopScanningSubject.complete();
  }
}
