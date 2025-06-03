import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import {
  Firestore,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  writeBatch, // Import writeBatch
  FirestoreError, // Import FirestoreError
  setDoc, // Import setDoc
} from '@angular/fire/firestore';

// Define interface for the user object from Firestore (assuming structure)
interface FirestoreUser {
  uid: string;
  displayName: string;
  role: string; // Assuming role is stored on the user document
  phone?: string; // Assuming phone might be stored
  // ... other user properties in Firestore
}

@Component({
  selector: 'app-qrscanner',
  standalone: true,
  imports: [ZXingScannerModule, CommonModule, FormsModule],
  templateUrl: './qrscanner.component.html',
  styleUrl: './qrscanner.component.css',
})
export class QrscannerComponent implements OnInit, OnDestroy {
  // ZXing Scanner Properties
  scannerEnabled = false;
  allowedFormats = [BarcodeFormat.QR_CODE];
  scanResult: string | null = null;
  noCamerasFound = false;
  firestore = inject(Firestore);
  location = inject(Location);

  statusMessage: string = 'Press "Start Scanning" to begin.';
  isVerifying: boolean = false;

  // State for QR Code Format Validation
  qrValidationMessage: string | null = null;
  qrValidationStatus: 'valid' | 'invalid' | 'info' | null = null;

  // State for Check-in Result (Database lookup & record)
  checkinResultMessage: string | null = null;
  checkinResultStatus: 'success' | 'failure' | null = null; // 'success' could be new checkin or already checked in

  // State for displaying user info after a *successful recognition* (whether new checkin or already checked in)
  checkedInUserName: string | null = null;
  checkedInUserRole: string | null = null;

  constructor() {
    console.log('QrscannerComponent initialized');
  }

  ngOnInit(): void {
    console.log('QrscannerComponent ngOnInit called');
  }

  // Method to navigate back
  goBack(): void {
    this.location.back();
  }

  // Called when cameras are detected
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

  // Called when a QR code is successfully scanned
  async onCodeResult(result: string) {
    this.scanResult = result;
    console.log('Raw Scanned Result:', result);

    // Clear previous results
    this.resetResultStates();

    this.statusMessage = 'QR Code scanned. Processing...';
    this.isVerifying = true; // Show verification indicator
    this.scannerEnabled = false; // Pause scanner

    let scannedData: any = null;
    let isJson = false;

    try {
      // Attempt to parse the scanned string as JSON
      scannedData = JSON.parse(result);
      isJson = true;
    } catch (e) {
      console.warn('Scanned data is not valid JSON:', e);
    }

    // Basic validation of JSON structure and required fields
    const isValidJsonStructure =
      isJson &&
      scannedData &&
      typeof scannedData === 'object' &&
      'uid' in scannedData &&
      'name' in scannedData &&
      'role' in scannedData;
    // Optional: 'phone' in scannedData if it's a mandatory field in the QR code

    if (isValidJsonStructure) {
      // --- Case 1: Scanned data is valid JSON with required fields ---
      console.log('QR Code data structure validated:', scannedData);
      this.qrValidationMessage = 'Valid QR Code Data Structure';
      this.qrValidationStatus = 'valid';
      this.statusMessage = 'User data format valid. Checking database...';

      // --- Proceed to Firestore Lookup and Check-in ---
      try {
        const userRef = doc(this.firestore, 'users', scannedData.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          console.log('User exists in Firestore.');
          const firestoreUserData = userSnap.data() as FirestoreUser; // Use FirestoreUser interface

          // Use data from Firestore as primary source if available and reliable
          const userName = firestoreUserData.displayName || scannedData.name;
          const userRole = firestoreUserData.role || scannedData.role;
          const userUID = firestoreUserData.uid; // Use UID from Firestore

          // NOW, CHECK IF USER IS ALREADY CHECKED IN in the 'checkins' collection
          const activeCheckinsQuery = query(
            collection(this.firestore, 'checkins'),
            where('uid', '==', userUID),
            where('checkin_status', '==', true)
          );

          const activeCheckinsSnapshot = await getDocs(activeCheckinsQuery);

          if (!activeCheckinsSnapshot.empty) {
            // User is already checked in (found an existing active check-in record)
            console.log('User already has an active check-in record.');
            this.checkinResultMessage = 'User Already Checked In';
            this.checkinResultStatus = 'success';
            this.statusMessage = `User ${userName} is already checked in.`;

            // Display info from Firestore or scanned data if Firestore missing
            this.checkedInUserName = userName;
            this.checkedInUserRole = userRole;
          } else {
            console.log(
              'User found in "users". No active check-in found. Recording new check-in.'
            );

            // Record the new check-in in the 'checkins' collection
            const checkinsCollection = collection(this.firestore, 'checkins');
            const newCheckinRef = await addDoc(checkinsCollection, {
              uid: userUID, // Use UID from Firestore
              name: userName, // Use name from Firestore or scanned
              role: userRole, // Use role from Firestore or scanned
              checkin_time: serverTimestamp(),
              checkin_status: true, // Mark as currently checked in
            });

            console.log('New check-in recorded with ID:', newCheckinRef.id);

            // --- New logic to create Check-in Alert in checkinalerts and User Status Records for Admins ---
            try {
              const now = new Date();
              const hours = now.getHours().toString().padStart(2, '0');
              const minutes = now.getMinutes().toString().padStart(2, '0');
              const checkinTimeFormatted = `${hours}:${minutes}`;

              // 1. Create the Alert document in the 'checkinalerts' collection
              const checkinAlertsCollection = collection(
                this.firestore,
                'checkinalerts'
              );
              const newCheckinAlertRef = doc(checkinAlertsCollection); // Create a new doc ref with a generated ID

              // Prepare check-in alert data for checkinalerts collection
              const checkinAlertData = {
                // Fields typically needed for a check-in notification
                name: userName, // Name of the user who checked in
                role: userRole, // Role of the user who checked in
                uid: userUID, // UID of the user who checked in
                checkin_time: serverTimestamp(), // Timestamp of the check-in
                time: checkinTimeFormatted, // Formatted time string
                // Add other relevant check-in details if needed
                // Add a 'read' field for potential global filtering in checkinalerts if desired, though userAlertStatus is per-user
                read: false,
              };

              // 2. Identify recipients (Admins)
              const adminRecipients: { uid: string; role: string }[] = [];
              const usersCollection = collection(this.firestore, 'users');

              // Fetch Admin users
              const adminUsersQuery = query(
                usersCollection,
                where('role', '==', 'admin')
              );
              const adminUsersSnapshot = await getDocs(adminUsersQuery);
              adminUsersSnapshot.docs.forEach((doc) => {
                const userData = doc.data() as FirestoreUser;
                adminRecipients.push({
                  uid: userData.uid,
                  role: userData.role,
                });
              });
              console.log(
                `Identified ${adminRecipients.length} admin recipients for check-in alert.`
              );

              // 3. Create userAlertStatus records for each Admin recipient using a batch write
              const batch = writeBatch(this.firestore);
              const userAlertStatusCollection = collection(
                this.firestore,
                'userAlertStatus'
              );

              if (adminRecipients.length > 0) {
                adminRecipients.forEach((recipient) => {
                  const userStatusRef = doc(userAlertStatusCollection); // Auto ID for status document
                  batch.set(userStatusRef, {
                    userId: recipient.uid,
                    alertId: newCheckinAlertRef.id, // <-- Link to the checkinAlerts document ID
                    isRead: false, // Mark as unread for this user
                    sentTimestamp: serverTimestamp(), // Timestamp for the user's status record
                    // Optional: include recipient role or other info if useful for status queries
                    // recipientRole: recipient.role
                    alertCollection: 'checkinalerts', // Explicitly state the collection for this alert
                  });
                });

                // Commit the batch write for the checkinAlert document and all user status records
                batch.set(newCheckinAlertRef, checkinAlertData); // Set the checkinAlert data within the batch
                await batch.commit();
                console.log(
                  `Batch write committed: Checkin Alert ${newCheckinAlertRef.id} created in checkinalerts and ${adminRecipients.length} admin user status records created.`
                );
              } else {
                // If no admin recipients found, just create the checkinAlert document
                await setDoc(newCheckinAlertRef, checkinAlertData); // Use setDoc with the ref
                console.warn(
                  `No admin recipients found for check-in alert. Only checkin alert document ${newCheckinAlertRef.id} created in checkinalerts.`
                );
              }
            } catch (alertCreationError: any) {
              console.error(
                'Failed to create check-in alert or user status records:',
                alertCreationError
              );
              // Log error and potentially notify admin/system, but don't fail the check-in itself
              if (alertCreationError instanceof FirestoreError) {
                console.error(
                  `Firestore Error Code: ${alertCreationError.code}`
                );
              }
            }
            // --- End of Check-in Alert and User Status Logic ---

            this.checkinResultMessage = 'Check-in Successful';
            this.checkinResultStatus = 'success'; // Success for a new check-in
            this.statusMessage = `User ${userName} checked in.`;

            // Display info from Firestore or scanned data
            this.checkedInUserName = userName;
            this.checkedInUserRole = userRole; // Use the role from Firestore or scanned data
          }
        } else {
          // User does NOT exist in the 'users' collection
          console.warn(
            'User with UID',
            scannedData.uid,
            'not found in Firestore "users" collection.'
          );
          this.checkinResultMessage = 'User Not Found in Database';
          this.checkinResultStatus = 'failure';
          this.statusMessage = 'User not found for valid QR Code.';
          // Clear user info display as user wasn't found
          this.checkedInUserName = null;
          this.checkedInUserRole = null;
        }
      } catch (firestoreError: any) {
        // Catch any Firestore error during lookup/check-in/alert creation
        console.error(
          'Firestore operation failed during check-in process:',
          firestoreError
        );
        this.checkinResultMessage = 'Database Error'; // General database error message
        this.checkinResultStatus = 'failure';
        this.statusMessage =
          'Failed to process check-in due to a database error.';
        // Clear user info display on error
        this.checkedInUserName = null;
        this.checkedInUserRole = null;
        if (firestoreError instanceof FirestoreError) {
          console.error(`Firestore Error Code: ${firestoreError.code}`);
          // Provide more specific feedback based on error code if helpful
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
      // --- Case 2: Not JSON at all ---
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
      this.checkinResultMessage = 'Check-in requires valid user data QR Code.';
      this.checkinResultStatus = 'failure';
      this.checkedInUserName = null;
      this.checkedInUserRole = null;
    } else {
      // --- Case 3: Was JSON, but missing required keys or not an object ---
      console.warn(
        'Scanned data was JSON but missing required fields or not an object:',
        scannedData
      );
      this.qrValidationMessage = 'Malformed QR Data';
      this.qrValidationStatus = 'invalid';
      this.statusMessage = 'QR Code data is incomplete or malformed.';
      this.checkinResultMessage = 'Check-in requires valid user data QR Code.';
      this.checkinResultStatus = 'failure';
      this.checkedInUserName = null;
      this.checkedInUserRole = null;
    }

    // --- End of processing ---
    this.isVerifying = false; // Hide verification indicator

    // Optional: Re-enable scanner after a delay
    // Consider user experience - automatically restarting might be annoying
    // if (!this.noCamerasFound && this.checkinResultStatus === 'success') { // Only restart on successful checkin (new or existing)
    //     setTimeout(() => {
    //         this.startCamera();
    //     }, 5000); // Restart after 5 seconds
    // }
  }

  // Called if there's a scanning error
  onScanError(error: any) {
    console.error('Scan error:', error);
    this.isVerifying = false;
    this.scannerEnabled = false; // Stop scanning on error

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
    // Reset results on error
    this.checkinResultMessage = null;
    this.checkinResultStatus = null;
    this.checkedInUserName = null;
    this.checkedInUserRole = null;
  }

  // Helper to reset result display states
  resetResultStates(): void {
    this.scanResult = null;
    this.qrValidationMessage = null;
    this.qrValidationStatus = null;
    this.checkinResultMessage = null;
    this.checkinResultStatus = null;
    this.checkedInUserName = null;
    this.checkedInUserRole = null;
    this.isVerifying = false;
  }

  startCamera() {
    console.log('Start Scanning button clicked.');
    // Reset states when starting a new scan attempt
    this.resetResultStates();

    if (!this.noCamerasFound) {
      if (!this.scannerEnabled) {
        this.scannerEnabled = true;
        this.statusMessage = 'Camera starting...';
        this.isVerifying = false; // Not verifying yet, just starting camera
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
      this.isVerifying = false; // Stop verifying if active
      console.log('Scanner disabled.');
    } else {
      this.statusMessage = 'Scanner is already stopped.';
    }
  }

  ngOnDestroy() {
    // Ensure scanner is stopped when the component is destroyed
    this.scannerEnabled = false;
    console.log('QrscannerComponent destroyed. Scanner disabled.');
  }
}
