import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  setDoc,
  doc,
  collection,
  Timestamp,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
  FirestoreError,
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { AuthService } from '../auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Import MatSnackBar and MatSnackBarModule

// Define the interface for your Flag data, using Timestamp
interface Flag {
  reportas: string;
  threat: string;
  location: string;
  badgecolour: string;
  attachment: null;
  involved: string;
  description: string;
  additional: string;
  reportedBy: string; // Display name of the reporter
  reportedByUid: string | null; // UID of the reporter
  timestamp: Timestamp;
  status: 'pending' | 'resolved';
}

// Define interface for the user object from Firestore (assuming structure)
interface FirestoreUser {
  uid: string;
  displayName?: string; // displayName from Auth, can be optional
  name?: string; // 'name' from Firestore doc
  role: string;
  // ... other user properties
}

@Component({
  selector: 'app-flag',
  standalone: true,
  imports: [FormsModule, CommonModule, MatSnackBarModule], // Add MatSnackBarModule here
  templateUrl: './flag.component.html',
  styleUrl: './flag.component.css',
})
export class FlagComponent implements AfterViewInit {
  formData = {
    reportas: '',
    threat: '',
    location: '',
    badgecolour: '',
    attachment: null, // Ensure this handles file objects correctly, currently null
    involved: '',
    description: '',
    additional: '',
  };

  @ViewChild('mainContainer', { static: false }) mainContainer!: ElementRef;
  @ViewChild('threat', { static: false }) threatSelect!: ElementRef;

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private authService: AuthService = inject(AuthService);
  private snackBar: MatSnackBar = inject(MatSnackBar); // Inject MatSnackBar

  constructor() {
    console.log('FlagComponent initialized');
  }

  ngAfterViewInit() {
    if (this.mainContainer && this.threatSelect) {
      this.threatSelect.nativeElement.addEventListener('change', () => {
        this.updateBackgroundColor();
      });
      this.updateBackgroundColor();
    } else {
      console.warn(
        'Main container or threat select element not available for background update in ngAfterViewInit.'
      );
    }
  }

  updateBackgroundColor() {
    if (this.mainContainer?.nativeElement && this.threatSelect?.nativeElement) {
      const threatValue = this.threatSelect.nativeElement.value;
      const mainContainerElement = this.mainContainer.nativeElement;

      switch (threatValue) {
        case 'High':
          mainContainerElement.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
          mainContainerElement.style.border = '2px solid red';
          break;
        case 'Medium':
          mainContainerElement.style.backgroundColor = 'rgba(255, 193, 7, 0.2)';
          mainContainerElement.style.border = '2px solid orange';
          break;
        case 'Low':
          mainContainerElement.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
          mainContainerElement.style.border = '2px solid green';
          break;
        case '': // For empty selection, reset styles
          mainContainerElement.style.backgroundColor = '';
          mainContainerElement.style.border = 'none';
          break;
        default:
          mainContainerElement.style.backgroundColor = '';
          mainContainerElement.style.border = 'none';
          break;
      }
    } else {
      console.warn(
        'Main container or threat select element not available for background update.'
      );
    }
  }

  async onSubmit() {
    // Basic form validation for required fields
    if (
      !this.formData.reportas ||
      !this.formData.threat ||
      !this.formData.location ||
      !this.formData.involved ||
      !this.formData.description
    ) {
      this.snackBar.open('Please fill in all required fields.', undefined, {
        duration: 3000,
        panelClass: ['warning-snackbar'],
      });
      return;
    }

    const currentUser = await this.authService.getCurrentUser();

    let reportedByName: string = 'Anonymous';
    let reportedByUid: string | null = null;

    if (currentUser && currentUser.uid) {
      reportedByUid = currentUser.uid;
    }

    if (this.formData.reportas === 'Name') {
      if (currentUser && (currentUser.displayName || currentUser.name)) {
        reportedByName =
          currentUser.displayName || currentUser.name || 'Unknown User';
      } else {
        this.snackBar.open(
          'Could not retrieve your name. Please log in or choose to report anonymously.',
          undefined,
          {
            duration: 5000,
            panelClass: ['warning-snackbar'],
          }
        );
        return;
      }
    }

    // --- Start a batch write operation ---
    const batch = writeBatch(this.firestore);

    // 1. Create the Flag document in the 'Flags' collection
    const flagsCollectionRef = collection(this.firestore, 'Flags');
    const newFlagDocRef = doc(flagsCollectionRef);

    const flagData: Flag = {
      reportedBy: reportedByName,
      reportedByUid: reportedByUid,
      threat: this.formData.threat,
      location: this.formData.location,
      badgecolour: this.formData.badgecolour,
      involved: this.formData.involved,
      description: this.formData.description,
      additional: this.formData.additional,
      timestamp: serverTimestamp() as Timestamp,
      status: 'pending',
      reportas: this.formData.reportas,
      attachment: this.formData.attachment,
    };
    batch.set(newFlagDocRef, flagData);
    console.log(
      `Batch added set operation for new flag ${newFlagDocRef.id} in Flags.`
    );

    // --- 2. Create the Flag Alert document in the 'flagalerts' collection ---
    const flagAlertsCollectionRef = collection(this.firestore, 'flagalerts');
    const newFlagAlertDocRef = doc(flagAlertsCollectionRef);

    const flagAlertMessage = `${reportedByName} has raised a ${this.formData.threat} threat flag.`;

    const flagAlertData = {
      alertType: 'Flag Raised',
      threatLevel: this.formData.threat,
      location: this.formData.location,
      reportedBy: reportedByName,
      reportedByUid: reportedByUid,
      flagId: newFlagDocRef.id,
      timestamp: serverTimestamp() as Timestamp,
      read: false,
      message: flagAlertMessage,
    };
    batch.set(newFlagAlertDocRef, flagAlertData);
    console.log(
      `Batch added set operation for new flag alert ${newFlagAlertDocRef.id} in flagalerts.`
    );

    // --- 3. Identify recipients (Admins and Security) and create userAlertStatus records ---
    const recipients: { uid: string; role: string }[] = [];

    try {
      const usersToNotify = await this.authService.getUsersForRoles([
        'admin',
        'security',
      ]);

      usersToNotify.forEach((userDoc) => {
        recipients.push({ uid: userDoc.uid, role: userDoc.role });
      });

      console.log(
        `Identified total ${recipients.length} recipients (Admin + Security).`
      );
    } catch (fetchUsersError: any) {
      console.error(
        'Error fetching admin and security users:',
        fetchUsersError
      );
      // Use snackbar instead of alert
      this.snackBar.open(
        'Error identifying alert recipients. Flag submitted, but alerts may not be sent.',
        undefined,
        {
          duration: 7000,
          panelClass: ['error-snackbar'],
        }
      );
    }

    // Create userAlertStatus records for each recipient
    const userAlertStatusCollection = collection(
      this.firestore,
      'userAlertStatus'
    );
    if (recipients.length > 0) {
      recipients.forEach((recipient) => {
        const userStatusRef = doc(userAlertStatusCollection);
        batch.set(userStatusRef, {
          userId: recipient.uid,
          alertId: newFlagAlertDocRef.id,
          isRead: false,
          sentTimestamp: serverTimestamp() as Timestamp,
          alertCollection: 'flagalerts',
          messageSnippet: flagAlertMessage,
          alertType: 'Flag Raised',
          senderName: reportedByName,
        });
      });
      console.log(
        `Batch added set operations for ${recipients.length} user status records.`
      );
    } else {
      console.warn(
        'No Admin or Security recipients found for flag alert. No user status records will be created.'
      );
      // Optional: Add a snackbar here if this is a critical warning for the user
      this.snackBar.open(
        'Warning: No admin or security personnel found to receive this flag alert. Please contact support.',
        undefined,
        {
          duration: 7000,
          panelClass: ['warning-snackbar'],
        }
      );
    }

    // --- Commit the batch write operation ---
    try {
      await batch.commit();
      console.log(
        `Batch write committed: Flag ${newFlagDocRef.id} in Flags, Alert ${newFlagAlertDocRef.id} in flagalerts, and ${recipients.length} user status records created.`
      );

      this.snackBar.open('Report submitted successfully.', undefined, {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
      this.resetForm();
    } catch (error: any) {
      console.error('Error submitting report or sending alert:', error);
      let userFacingMessage =
        'Failed to submit report or send alert. Please try again.';

      if (error instanceof FirestoreError) {
        console.error(`Firestore Error Code: ${error.code}`);
        if (error.code === 'permission-denied') {
          userFacingMessage =
            'Permission Denied: You do not have the necessary permissions to submit a report.';
        } else if (error.code === 'unavailable') {
          userFacingMessage =
            'Network Error: Cannot connect to the database. Please check your internet connection.';
        } else if (error.code === 'aborted') {
          userFacingMessage =
            'Operation cancelled: The report submission was interrupted. Please try again.';
        }
        // Add more Firestore error codes as needed
      }

      this.snackBar.open(userFacingMessage, undefined, {
        duration: 7000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  resetForm() {
    this.formData = {
      reportas: '',
      threat: '',
      location: '',
      badgecolour: '',
      attachment: null,
      involved: '',
      description: '',
      additional: '',
    };
    if (this.threatSelect?.nativeElement) {
      this.threatSelect.nativeElement.value = '';
      this.updateBackgroundColor();
    }
  }
}
