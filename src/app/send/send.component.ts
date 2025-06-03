import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { AuthService } from '../auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Re-using the UserData interface from auth.service.ts for consistency
interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  role: string; // The crucial 'role' property is here
  phoneNumber?: string;
  accountCreated?: boolean;
  passwordSet?: boolean;
}

@Component({
  selector: 'app-send',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './send.component.html',
  styleUrl: './send.component.css',
})
export class SendComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);
  private snackBar: MatSnackBar = inject(MatSnackBar);

  isVisibleNotice: boolean = false;
  noticeTitle: string = '';
  noticeMessage: string = '';

  targetedAlertSubject: string = '';
  targetedAlertMessage: string = '';
  allUsers: UserData[] = []; // Changed to UserData[] for consistency
  selectedRecipientIds: string[] = [];

  constructor() {
    console.log('SecuritySendComponent initialized');
  }

  ngOnInit(): void {
    console.log('SecuritySendComponent ngOnInit called');
    this.fetchAllUsers();
  }

  async fetchAllUsers(): Promise<void> {
    console.log('Fetching all users for targeted recipient selection...');
    try {
      const usersCollection = collection(this.firestore, 'users');
      const q = query(usersCollection);
      const querySnapshot = await getDocs(q);

      this.allUsers = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          displayName: data['displayName'] || data['name'] || 'Unnamed User',
          email: data['email'] || null,
          role: data['role'] || 'unknown',
          name: data['name'] || null,
        } as UserData; // Cast to UserData
      });

      console.log(
        'Users fetched for recipient selection:',
        this.allUsers.length
      );
    } catch (error) {
      console.error('Error fetching users for recipient selection:', error);
      this.snackBar.open(
        'Error fetching recipient list. Please try again.',
        undefined, // Removed 'Dismiss'
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    }
  }

  getSelectedRecipientNames(): string {
    if (this.selectedRecipientIds.length === 0) {
      return '';
    }
    const selectedNames = this.selectedRecipientIds.map((uid) => {
      const user = this.allUsers.find((u) => u.uid === uid);
      return user
        ? user.displayName || user.name || 'Unknown User'
        : 'Unknown User';
    });
    return selectedNames.join(', ');
  }

  isSelectedRecipient(uid: string): boolean {
    return this.selectedRecipientIds.includes(uid);
  }

  toggleRecipientSelection(uid: string): void {
    const index = this.selectedRecipientIds.indexOf(uid);
    if (index === -1) {
      this.selectedRecipientIds.push(uid);
    } else {
      this.selectedRecipientIds.splice(index, 1);
    }
    console.log('Selected recipients:', this.selectedRecipientIds);
  }

  openNotice(): void {
    console.log('Opening Notice modal');
    this.isVisibleNotice = true;
    this.noticeTitle = '';
    this.noticeMessage = '';
  }

  closeNotice(): void {
    console.log('Closing Notice modal');
    this.isVisibleNotice = false;
    this.noticeTitle = '';
    this.noticeMessage = '';
  }

  async issueNotice(): Promise<void> {
    console.log('Attempting to issue Notice');

    if (!this.noticeTitle.trim() || !this.noticeMessage.trim()) {
      this.snackBar.open(
        'Notice title and message cannot be empty.',
        undefined, // Removed 'Dismiss'
        {
          duration: 3000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    // Access user data from the currentUserData signal
    const currentFirestoreUser = this.authService.currentUserData();
    const senderId = currentFirestoreUser?.uid || 'unknown';
    const senderName =
      currentFirestoreUser?.displayName ||
      currentFirestoreUser?.name ||
      'Unknown Sender';
    const senderRole = currentFirestoreUser?.role || 'Unknown Role';

    // Get current time for the message
    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      const alertsCollection = collection(this.firestore, 'alerts');
      const noticeDataObject = {
        subject: this.noticeTitle.trim(),
        message: `${this.noticeMessage.trim()} (Sent at ${currentTime})`, // Append time
        alertType: 'Notice',
        deliveryMethod: 'general',
        senderId: senderId,
        senderName: senderName,
        senderRole: senderRole,
        timestamp: serverTimestamp(),
        code: 'notice',
      };
      console.log('Saving Notice content:', noticeDataObject);
      const alertRef = await addDoc(alertsCollection, noticeDataObject);
      const newAlertId = alertRef.id;
      console.log('Notice content saved with ID:', newAlertId);

      await this.createNoticeAlertStatusRecords(newAlertId);

      this.snackBar.open('Notice sent successfully!', undefined, {
        // Removed 'Dismiss'
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
      this.closeNotice();
    } catch (error: any) {
      console.error('Error issuing notice:', error);
      this.snackBar.open(`Failed to send notice: ${error.message}`, undefined, {
        // Removed 'Close'
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  async createGeneralAlertStatusRecords(alertId: string): Promise<void> {
    console.log(
      `Creating user status records for General alert ID: ${alertId} (Includes Visitors)`
    );
    try {
      const usersCollection = collection(this.firestore, 'users');
      const q = query(usersCollection);
      const querySnapshot = await getDocs(q);

      const generalRecipientUids = querySnapshot.docs.map((doc) => doc.id);
      console.log(
        `Found ${generalRecipientUids.length} general alert recipients.`
      );

      if (generalRecipientUids.length === 0) {
        console.warn('No general alert recipients found.');
        return;
      }

      const batch = writeBatch(this.firestore);
      const userAlertStatusCollection = collection(
        this.firestore,
        'userAlertStatus'
      );

      const batchSize = 499;
      for (let i = 0; i < generalRecipientUids.length; i += batchSize) {
        const batchRecipientUids = generalRecipientUids.slice(i, i + batchSize);
        const currentBatch = writeBatch(this.firestore);

        batchRecipientUids.forEach((recipientUid) => {
          const userAlertStatusDocRef = doc(userAlertStatusCollection);
          const userStatusData = {
            alertId: alertId,
            userId: recipientUid,
            isRead: false,
            sentTimestamp: serverTimestamp(),
          };
          currentBatch.set(userAlertStatusDocRef, userStatusData);
        });

        await currentBatch.commit();
        console.log(
          `Committed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
            generalRecipientUids.length / batchSize
          )} for General alert status.`
        );
      }

      console.log(
        'All batches for General alert status records committed successfully.'
      );
    } catch (error) {
      console.error('Error creating General alert status records:', error);
      throw error;
    }
  }

  async createNoticeAlertStatusRecords(alertId: string): Promise<void> {
    console.log(
      `Creating user status records for Notice alert ID: ${alertId} (Excludes Visitors)`
    );
    try {
      const usersCollection = collection(this.firestore, 'users');
      const q = query(usersCollection, where('role', '!=', 'visitor'));
      console.log(
        'Querying for Notice alert recipients (excluding visitors)...'
      );
      const querySnapshot = await getDocs(q);

      const noticeRecipientUids = querySnapshot.docs.map((doc) => doc.id);
      console.log(
        `Found ${noticeRecipientUids.length} notice alert recipients.`
      );

      if (noticeRecipientUids.length === 0) {
        console.warn('No notice alert recipients found.');
        return;
      }

      const batch = writeBatch(this.firestore);
      const userAlertStatusCollection = collection(
        this.firestore,
        'userAlertStatus'
      );

      const batchSize = 499;
      for (let i = 0; i < noticeRecipientUids.length; i += batchSize) {
        const batchRecipientUids = noticeRecipientUids.slice(i, i + batchSize);
        const currentBatch = writeBatch(this.firestore);

        batchRecipientUids.forEach((recipientUid) => {
          const userAlertStatusDocRef = doc(userAlertStatusCollection);
          const userStatusData = {
            alertId: alertId,
            userId: recipientUid,
            isRead: false,
            sentTimestamp: serverTimestamp(),
          };
          currentBatch.set(userAlertStatusDocRef, userStatusData);
        });

        await currentBatch.commit();
        console.log(
          `Committed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
            noticeRecipientUids.length / batchSize
          )} for Notice alert status.`
        );
      }

      console.log(
        'All batches for Notice alert status records committed successfully.'
      );
    } catch (error) {
      console.error('Error creating Notice alert status records:', error);
      throw error;
    }
  }

  async sendAlert(type: string): Promise<void> {
    console.log(`Direct General Alert button clicked: ${type}`);

    // Access user data from the currentUserData signal
    const currentFirestoreUser = this.authService.currentUserData();
    const senderId = currentFirestoreUser?.uid || 'unknown';
    const senderName =
      currentFirestoreUser?.displayName ||
      currentFirestoreUser?.name ||
      'Unknown Sender';
    const senderRole = currentFirestoreUser?.role || 'Unknown Role';

    let defaultSubject = '';
    let defaultMessage = '';

    // Construct the sender identifier with name and role
    const senderIdentifier = `${senderName} (${senderRole})`;
    // Get current time for the message
    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    switch (type.toLowerCase()) {
      case 'medical':
        defaultSubject = 'Medical Assistance Required';
        defaultMessage = `${senderIdentifier} is requesting medical assistance.`;
        break;
      case 'lockdown':
        defaultSubject = 'Lockdown Issued';
        defaultMessage = `Lockdown has been issued by ${senderIdentifier}.`;
        break;
      case 'hazard':
        defaultSubject = 'Hazard Alert';
        defaultMessage = `A hazardous situation has been reported by ${senderIdentifier}.`;
        break;
      case 'fire':
        defaultSubject = 'Fire Alert';
        defaultMessage = `A fire has been reported by ${senderIdentifier}.`;
        break;
      case 'security':
        defaultSubject = 'Security Assistance Requested';
        defaultMessage = `${senderIdentifier} is requesting security assistance.`;
        break;
      default:
        defaultSubject = `${type} Alert`;
        defaultMessage = `${senderIdentifier} has issued a ${type.toLowerCase()} alert.`;
    }

    // Append the time to the message
    defaultMessage = `${defaultMessage} (Sent at ${currentTime})`;

    try {
      const alertsCollection = collection(this.firestore, 'alerts');
      const alertDataObject = {
        subject: defaultSubject,
        message: defaultMessage, // Now includes time
        alertType: type,
        deliveryMethod: 'general',
        senderId: senderId,
        senderName: senderName,
        senderRole: senderRole,
        timestamp: serverTimestamp(),
        code: type.toLowerCase(),
      };

      console.log(`Saving General ${type} alert content:`, alertDataObject);
      const alertRef = await addDoc(alertsCollection, alertDataObject);
      const newAlertId = alertRef.id;
      console.log(`General ${type} alert content saved with ID:`, newAlertId);

      await this.createGeneralAlertStatusRecords(newAlertId);

      this.snackBar.open(`${type} alert sent generally!`, undefined, {
        // Removed 'Dismiss'
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    } catch (error: any) {
      console.error(`Error sending General ${type} alert:`, error);
      this.snackBar.open(
        `Failed to send ${type} alert: ${error.message}`,
        undefined, // Removed 'Close'
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    }
  }

  isTargetedSendButtonDisabled(): boolean {
    return (
      !this.targetedAlertSubject.trim() ||
      !this.targetedAlertMessage.trim() ||
      this.selectedRecipientIds.length === 0
    );
  }

  async sendTargetedAlert(): Promise<void> {
    console.log('Attempting to send Targeted Alert');

    if (!this.targetedAlertSubject.trim()) {
      this.snackBar.open('Alert subject cannot be empty.', undefined, {
        // Removed 'Dismiss'
        duration: 3000,
        panelClass: ['warning-snackbar'],
      });
      return;
    }
    if (!this.targetedAlertMessage.trim()) {
      this.snackBar.open('Alert message cannot be empty.', undefined, {
        // Removed 'Dismiss'
        duration: 3000,
        panelClass: ['warning-snackbar'],
      });
      return;
    }
    if (this.selectedRecipientIds.length === 0) {
      this.snackBar.open(
        'Please select at least one recipient for a targeted alert.',
        undefined, // Removed 'Dismiss'
        {
          duration: 3000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    // Access user data from the currentUserData signal
    const currentFirestoreUser = this.authService.currentUserData();
    const senderId = currentFirestoreUser?.uid || 'unknown';
    const senderName =
      currentFirestoreUser?.displayName ||
      currentFirestoreUser?.name ||
      'Unknown Sender';
    const senderRole = currentFirestoreUser?.role || 'Unknown Role';

    // Get current time for the message
    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      const alertsCollection = collection(this.firestore, 'alerts');
      const alertDataObject = {
        subject: this.targetedAlertSubject.trim(),
        message: `${this.targetedAlertMessage.trim()} (Sent at ${currentTime})`, // Append time
        alertType: 'Targeted',
        deliveryMethod: 'targeted',
        senderId: senderId,
        senderName: senderName,
        senderRole: senderRole,
        timestamp: serverTimestamp(),
        code: 'targeted',
      };

      console.log('Saving targeted alert content:', alertDataObject);
      const alertRef = await addDoc(alertsCollection, alertDataObject);
      const newAlertId = alertRef.id;
      console.log('Targeted alert content saved with ID:', newAlertId);

      const batch = writeBatch(this.firestore);
      const userAlertStatusCollection = collection(
        this.firestore,
        'userAlertStatus'
      );

      const batchSize = 499;
      for (let i = 0; i < this.selectedRecipientIds.length; i += batchSize) {
        const batchRecipientUids = this.selectedRecipientIds.slice(
          i,
          i + batchSize
        );
        const currentBatch = writeBatch(this.firestore);

        batchRecipientUids.forEach((recipientUid) => {
          const userAlertStatusDocRef = doc(userAlertStatusCollection);
          const userStatusData = {
            alertId: newAlertId,
            userId: recipientUid,
            isRead: false,
            sentTimestamp: serverTimestamp(),
          };
          currentBatch.set(userAlertStatusDocRef, userStatusData);
        });

        await currentBatch.commit();
        console.log(
          `Committed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
            this.selectedRecipientIds.length / batchSize
          )} for Targeted alert status.`
        );
      }

      console.log(
        'All batches for Targeted alert status records committed successfully.'
      );

      this.snackBar.open('Targeted alert sent successfully!', undefined, {
        // Removed 'Dismiss'
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
      this.targetedAlertSubject = '';
      this.targetedAlertMessage = '';
      this.selectedRecipientIds = [];
    } catch (error: any) {
      console.error('Error sending targeted alert:', error);
      this.snackBar.open(
        `Failed to send targeted alert: ${error.message}`,
        undefined, // Removed 'Close'
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    }
  }
}
