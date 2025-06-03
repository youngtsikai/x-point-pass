import { CommonModule, Location, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import {
  Firestore,
  doc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  FirestoreError,
} from '@angular/fire/firestore'; // Removed unused imports
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface FirestoreUser {
  uid: string;
  displayName: string;
  role: string;
  isBlacklisted?: boolean;
}

interface ScannedVisitQrData {
  visitorUid: string;
  name: string;
  phone: string;
  idnum: string;
  licenseplate: string;
  purpose: string;
  host: string;
  visitDate: string;
  visitTime: string;
  status: string;
}

interface PreRegisteredVisit {
  id: string;
  visitorUid: string;
  name: string;
  phone: string;
  idnum: string;
  licenseplate: string;
  purpose: string;
  host: string;
  visitDate: string;
  visitTime: string;
  status: 'pending' | 'acknowledged' | 'cancelled' | 'disacknowledged';
}

@Component({
  selector: 'app-visitor-checkin',
  standalone: true,
  imports: [ZXingScannerModule, CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './visitor-checkin.component.html',
  styleUrl: './visitor-checkin.component.css',
  providers: [DatePipe],
})
export class VisitorCheckinComponent implements OnInit, OnDestroy {
  scannerEnabled = false;
  allowedFormats = [BarcodeFormat.QR_CODE];
  scanResult: string | null = null;
  noCamerasFound = false;
  firestore = inject(Firestore);
  location = inject(Location);
  private ngZone = inject(NgZone);
  statusMessage: string = 'Press "Start Scanning" to begin.';
  isVerifying: boolean = false;

  qrValidationMessage: string | null = null;
  qrValidationStatus: 'valid' | 'invalid' | 'info' | null = null;

  checkinResultMessage: string | null = null;
  checkinResultStatus: 'success' | 'failure' | null = null;

  checkedInVisitorName: string | null = null;
  checkedInHostName: string | null = null;
  checkedInPurpose: string | null = null;

  constructor(private _snackBar: MatSnackBar, private datePipe: DatePipe) {
    console.log('VisitorCheckinComponent initialized');
  }

  ngOnInit(): void {
    console.log('VisitorCheckinComponent ngOnInit called');
  }

  goBack(): void {
    this.location.back();
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    console.log('Cameras found:', devices);
    if (devices && devices.length > 0) {
      this.noCamerasFound = false;
      this.statusMessage = `Found ${devices.length} camera(s). Press "Start Scanning".`;
    } else {
      this.noCamerasFound = true;
      this.statusMessage = 'No cameras found on this device.';
      this.qrValidationMessage = 'Camera Unavailable';
      this.qrValidationStatus = 'invalid';
    }
  }

  async onCodeResult(result: string) {
    this.scanResult = result;
    console.log('Raw Scanned Result:', result);

    this.resetResultStates();

    this.statusMessage = 'QR Code scanned. Processing...';
    this.isVerifying = true;
    this.scannerEnabled = false;

    let scannedData: ScannedVisitQrData | null = null;
    let isJson = false;

    try {
      const parsed = JSON.parse(result);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'visitorUid' in parsed && // Changed from 'uid' to 'visitorUid' to match PreRegisteredVisit
        'name' in parsed &&
        'phone' in parsed &&
        'idnum' in parsed &&
        'licenseplate' in parsed &&
        'purpose' in parsed &&
        'host' in parsed &&
        'visitDate' in parsed &&
        'visitTime' in parsed &&
        'status' in parsed
      ) {
        scannedData = parsed as ScannedVisitQrData;
        isJson = true;
      } else {
        console.warn(
          'Scanned data is JSON but missing required visit fields or malformed.'
        );
        isJson = true;
      }
    } catch (e) {
      console.warn('Scanned data is not valid JSON or not a visit QR:', e);
    }

    if (scannedData && isJson) {
      console.log('QR Code data structure validated for visit:', scannedData);
      this.qrValidationMessage = 'Valid Visit QR Code Data';
      this.qrValidationStatus = 'valid';
      this.statusMessage = 'Visit data format valid. Checking database...';

      try {
        const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
        console.log(`Current Date (formatted): ${today}`);
        console.log(`Visit Date from QR: ${scannedData.visitDate}`);

        if (scannedData.visitDate !== today) {
          this.checkinResultMessage =
            'Check-in Failed: Visit Date Does Not Match Today';
          this.checkinResultStatus = 'failure';
          this.statusMessage = `This visit is scheduled for ${scannedData.visitDate}, not today.`;
          this._snackBar.open(this.statusMessage, 'Dismiss', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          this.isVerifying = false;
          return;
        }

        const visitsCollectionRef = collection(
          this.firestore,
          'visitor-preregistrations'
        );
        // IMPORTANT: Querying using visitorUid and other details to find the specific pre-registration document
        const visitQuery = query(
          visitsCollectionRef,
          where('visitorUid', '==', scannedData.visitorUid), // Use visitorUid from QR
          where('name', '==', scannedData.name),
          where('phone', '==', scannedData.phone),
          where('idnum', '==', scannedData.idnum),
          where('licenseplate', '==', scannedData.licenseplate),
          where('purpose', '==', scannedData.purpose),
          where('host', '==', scannedData.host),
          where('visitDate', '==', scannedData.visitDate),
          where('visitTime', '==', scannedData.visitTime)
        );

        const visitSnapshot = await getDocs(visitQuery);

        if (!visitSnapshot.empty) {
          const visitDoc = visitSnapshot.docs[0];
          const preRegisteredVisit: PreRegisteredVisit = {
            id: visitDoc.id,
            ...(visitDoc.data() as Omit<PreRegisteredVisit, 'id'>),
          };

          if (preRegisteredVisit.status !== 'acknowledged') {
            this.checkinResultMessage = `Check-in Failed: Visit Status is ${preRegisteredVisit.status}`;
            this.checkinResultStatus = 'failure';
            this.statusMessage = `This visit is ${preRegisteredVisit.status}. Only 'acknowledged' visits can check-in.`;
            this._snackBar.open(this.statusMessage, 'Dismiss', {
              duration: 5000,
              panelClass: ['error-snackbar'],
            });
            this.isVerifying = false;
            return;
          }

          // --- Check if Visitor is ALREADY CHECKED IN in the 'checkins' collection ---
          const checkinsCollectionRef = collection(this.firestore, 'checkins');
          const existingVisitorCheckinQuery = query(
            checkinsCollectionRef,
            where('visitId', '==', preRegisteredVisit.id), // Use the actual Firestore document ID as visitId
            where('checkin_status', '==', true), // Ensure it's an active check-in
            where('type', '==', 'visitor') // Make sure it's a visitor check-in
          );
          const existingCheckinSnapshot = await getDocs(
            existingVisitorCheckinQuery
          );

          if (!existingCheckinSnapshot.empty) {
            console.log(
              'Visitor already checked in for this pre-registration in the main checkins collection.'
            );
            this.checkinResultMessage = 'Visitor Already Checked In';
            this.checkinResultStatus = 'success';
            this.statusMessage = `Visitor ${preRegisteredVisit.name} is already checked in for this visit.`;
            this._snackBar.open(this.statusMessage, 'Dismiss', {
              duration: 5000,
              panelClass: ['warning-snackbar'],
            });
            this.checkedInVisitorName = preRegisteredVisit.name;
            this.checkedInHostName = preRegisteredVisit.host;
            this.checkedInPurpose = preRegisteredVisit.purpose;
            this.isVerifying = false;
            return;
          }

          // --- Blacklist Check (Users Collection) ---
          if (preRegisteredVisit.visitorUid) {
            const userRef = doc(
              this.firestore,
              'users',
              preRegisteredVisit.visitorUid
            );
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const firestoreUserData = userSnap.data() as FirestoreUser;
              if (firestoreUserData.isBlacklisted === true) {
                console.warn(
                  'Check-in Failed: Visitor is blacklisted. UID:',
                  preRegisteredVisit.visitorUid
                );
                this.checkinResultMessage =
                  'Check-in Failed: Visitor is Blacklisted';
                this.checkinResultStatus = 'failure';
                this.statusMessage = `Visitor ${preRegisteredVisit.name} is blacklisted and cannot check in.`;
                this._snackBar.open(this.statusMessage, 'Dismiss', {
                  duration: 6000,
                  panelClass: ['error-snackbar'],
                });
                this.isVerifying = false;
                return;
              }
            } else {
              console.warn(
                'Visitor UID not found in "users" collection, proceeding without blacklist check.'
              );
            }
          } else {
            console.warn(
              'No visitorUid found in pre-registration for blacklist check.'
            );
          }

          // --- ALL CHECKS PASSED: Proceed with Check-in ---
          const batch = writeBatch(this.firestore);

          // 1. Update the pre-registration status to 'checked-in'
          batch.update(visitDoc.ref, {
            checkinTime: serverTimestamp(),
          });
          console.log(
            `Pre-registration ${preRegisteredVisit.id} status updated to 'checked-in'.`
          );

          // 2. Add a new record to the main 'checkins' collection
          const newCheckinRef = doc(checkinsCollectionRef);
          batch.set(newCheckinRef, {
            type: 'visitor',
            visitId: preRegisteredVisit.id,
            uid: preRegisteredVisit.visitorUid || null,
            name: preRegisteredVisit.name,
            role: 'visitor',
            hostName: preRegisteredVisit.host,
            purpose: preRegisteredVisit.purpose,
            checkin_time: serverTimestamp(),
            checkin_status: true, // Mark as currently checked in
            idnum: preRegisteredVisit.idnum,
            licenseplate: preRegisteredVisit.licenseplate,
            phone: preRegisteredVisit.phone,
          });
          console.log(
            `New record added to "checkins" collection with ID: ${newCheckinRef.id} for visitor.`
          );

          // 3. Create a check-in alert for admins (similar to internal user check-in)
          try {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const checkinTimeFormatted = `${hours}:${minutes}`;

            const checkinAlertsCollection = collection(
              this.firestore,
              'checkinalerts'
            );
            const newCheckinAlertRef = doc(checkinAlertsCollection);

            const checkinAlertData = {
              name: preRegisteredVisit.name,
              role: 'visitor',
              uid: preRegisteredVisit.visitorUid || 'N/A',
              checkin_time: serverTimestamp(),
              time: checkinTimeFormatted,
              message: `Visitor ${preRegisteredVisit.name} has checked in for a visit with ${preRegisteredVisit.host}.`,
              type: 'visitor_checkin',
              read: false,
            };

            const adminRecipients: { uid: string; role: string }[] = [];
            const usersCollection = collection(this.firestore, 'users');
            const adminUsersQuery = query(
              usersCollection,
              where('role', '==', 'admin')
            );
            const adminUsersSnapshot = await getDocs(adminUsersQuery);
            adminUsersSnapshot.docs.forEach((doc) => {
              const userData = doc.data() as FirestoreUser;
              adminRecipients.push({ uid: userData.uid, role: userData.role });
            });

            const userAlertStatusCollection = collection(
              this.firestore,
              'userAlertStatus'
            );

            if (adminRecipients.length > 0) {
              adminRecipients.forEach((recipient) => {
                const userStatusRef = doc(userAlertStatusCollection);
                batch.set(userStatusRef, {
                  userId: recipient.uid,
                  alertId: newCheckinAlertRef.id,
                  isRead: false,
                  sentTimestamp: serverTimestamp(),
                  alertCollection: 'checkinalerts',
                });
              });
              batch.set(newCheckinAlertRef, checkinAlertData);
            } else {
              console.warn(
                `No admin recipients found for visitor check-in alert. Alert document ${newCheckinAlertRef.id} created directly.`
              );
              batch.set(newCheckinAlertRef, checkinAlertData);
            }
          } catch (alertCreationError: any) {
            console.error(
              'Failed to create visitor check-in alert or user status records:',
              alertCreationError
            );
            if (alertCreationError instanceof FirestoreError) {
              console.error(`Firestore Error Code: ${alertCreationError.code}`);
            }
          }

          await batch.commit();
          console.log(
            'Batch operations (update pre-registration, add check-in, alerts) committed successfully.'
          );

          this.checkinResultMessage = 'Visitor Check-in Successful!';
          this.checkinResultStatus = 'success';
          this.statusMessage = `Visitor ${preRegisteredVisit.name} checked in.`;

          this.checkedInVisitorName = preRegisteredVisit.name;
          this.checkedInHostName = preRegisteredVisit.host;
          this.checkedInPurpose = preRegisteredVisit.purpose;
        } else {
          console.warn(
            'No matching pre-registration found for scanned QR data based on provided details.'
          );
          this.checkinResultMessage = 'No Matching Pre-Registration Found';
          this.checkinResultStatus = 'failure';
          this.statusMessage =
            'QR Code data does not match any existing pre-registration. Please ensure all details are correct and visit is acknowledged.';
          this._snackBar.open(this.statusMessage, 'Dismiss', {
            duration: 7000, // Increased duration to make sure user sees it
            panelClass: ['error-snackbar'],
          });
        }
      } catch (firestoreError: any) {
        console.error(
          'Firestore operation failed during visitor check-in process:',
          firestoreError
        );
        this.checkinResultMessage = 'Database Error';
        this.checkinResultStatus = 'failure';
        this.statusMessage =
          'Failed to process visitor check-in due to a database error.';
        this.checkedInVisitorName = null;
        this.checkedInHostName = null;
        this.checkedInPurpose = null;
        if (firestoreError instanceof FirestoreError) {
          console.error(`Firestore Error Code: ${firestoreError.code}`);
          if (firestoreError.code === 'permission-denied') {
            this.statusMessage =
              'Security Rule Violation: Permission Denied to write to database.';
            this.checkinResultMessage = 'Check-in Failed (Security Error).';
          } else if (firestoreError.code === 'unavailable') {
            this.statusMessage = 'Cannot connect to database. Check network.';
            this.checkinResultMessage = 'Check-in Failed (Network Error).';
          }
        }
      }
    } else if (!isJson) {
      console.log('Scanned data is not JSON...');
      const urlRegex = /^(https?:\/\/|www\.)\S+/i;
      if (urlRegex.test(result)) {
        console.log('Scanned data looks like a URL:', result);
        this.qrValidationMessage = 'Scanned a URL';
        this.qrValidationStatus = 'info';
        this.statusMessage = 'Scanned a URL.';
      } else {
        console.warn('Scanned data is not JSON and format is not recognized.');
        this.qrValidationMessage = 'Unrecognized Format';
        this.qrValidationStatus = 'invalid';
        this.statusMessage = 'Unrecognized QR Code format.';
      }
      this.checkinResultMessage = 'Check-in requires a valid visitor QR Code.';
      this.checkinResultStatus = 'failure';
      this.checkedInVisitorName = null;
      this.checkedInHostName = null;
      this.checkedInPurpose = null;
    } else {
      console.warn(
        'Scanned data was JSON but missing required visit fields or not an object:',
        scannedData
      );
      this.qrValidationMessage = 'Malformed Visit QR Data';
      this.qrValidationStatus = 'invalid';
      this.statusMessage =
        'QR Code data is incomplete or malformed for a visit.';
      this.checkinResultMessage = 'Check-in requires a valid visitor QR Code.';
      this.checkinResultStatus = 'failure';
      this.checkedInVisitorName = null;
      this.checkedInHostName = null;
      this.checkedInPurpose = null;
    }

    this.isVerifying = false;
  }

  onScanError(error: any) {
    console.error('Scan error:', error);
    this.isVerifying = false;
    this.scannerEnabled = false;

    this.ngZone.run(() => {
      if (error && error.name === 'NotAllowedError') {
        this.statusMessage =
          'Camera permission denied. Please allow camera access.';
        this.qrValidationMessage = 'Permission Denied';
        this.qrValidationStatus = 'invalid';
      } else if (error && error.name === 'NotFoundError') {
        this.statusMessage = 'No camera devices found.';
        this.noCamerasFound = true;
        this.qrValidationMessage = 'No Camera';
        this.qrValidationStatus = 'invalid';
      } else {
        this.statusMessage = 'An error occurred during scanning.';
        this.qrValidationMessage = 'Scan Error';
        this.qrValidationStatus = 'invalid';
      }
      this.checkinResultMessage = null;
      this.checkinResultStatus = null;
      this.checkedInVisitorName = null;
      this.checkedInHostName = null;
      this.checkedInPurpose = null;
    });
  }

  resetResultStates(): void {
    this.scanResult = null;
    this.qrValidationMessage = null;
    this.qrValidationStatus = null;
    this.checkinResultMessage = null;
    this.checkinResultStatus = null;
    this.checkedInVisitorName = null;
    this.checkedInHostName = null;
    this.checkedInPurpose = null;
    this.isVerifying = false;
  }

  startCamera() {
    console.log('Start Scanning button clicked.');
    this.resetResultStates();

    if (!this.noCamerasFound) {
      if (!this.scannerEnabled) {
        this.scannerEnabled = true;
        this.statusMessage = 'Camera starting...';
        this.isVerifying = false;
        console.log('Scanner enabled.');
      } else {
        this.statusMessage = 'Scanner is already running.';
      }
    } else {
      this.statusMessage = 'Cannot start scanner: No cameras found.';
      console.warn('Attempted to start scanner but no cameras found.');
    }
  }

  stopCamera() {
    console.log('Stop Scanning button clicked.');
    if (this.scannerEnabled) {
      this.scannerEnabled = false;
      this.statusMessage = 'Scanner stopped.';
      this.isVerifying = false;
      console.log('Scanner disabled.');
    } else {
      this.statusMessage = 'Scanner is already stopped.';
    }
  }

  ngOnDestroy() {
    this.scannerEnabled = false;
    console.log('VisitorCheckinComponent destroyed. Scanner disabled.');
  }
}
