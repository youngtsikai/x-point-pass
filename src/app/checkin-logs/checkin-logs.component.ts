import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  where,
  addDoc,
  serverTimestamp,
  Timestamp, // Keep Timestamp imported for fetching
  writeBatch, // Import writeBatch
  FirestoreError, // Import FirestoreError
  setDoc, // Import setDoc
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs'; // Keep Subscription if used elsewhere
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { AuthService } from '../auth.service'; // Import AuthService

// Define interface for the user object from Firestore (assuming structure)
interface FirestoreUser {
  uid: string;
  displayName: string;
  role: string; // Assuming role is stored on the user document
  // ... other user properties
}

// Define interface for CheckinRecord, using Date | null for times after mapping
interface CheckinRecord {
  id?: string; // Document ID
  name: string;
  role: string;
  checkin_time: Date | null; // Use Date | null after conversion
  checkout_time: Date | null; // Use Date | null after conversion
  checkin_kiosk_id?: string | null;
  checkout_kiosk_id?: string | null;
  checkin_status?: boolean;
  uid?: string; // Add uid field if stored and needed
}

@Component({
  selector: 'app-checkin-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SecurityHeaderComponent,
    SecuritySidebarComponent,
  ],
  templateUrl: './checkin-logs.component.html',
  styleUrls: ['./checkin-logs.component.css'], // Use styleUrls for array
})
export class CheckinLogsComponent implements OnInit, OnDestroy {
  allCheckinLogs: CheckinRecord[] = [];
  filteredCheckinLogs: CheckinRecord[] = [];
  loading = true;
  error: string | null = null;
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService); // Inject AuthService
  private subscriptions: Subscription[] = [];
  selectedDate: string = '';

  ngOnInit(): void {
    this.fetchCheckinLogsForToday();
  }

  async fetchCheckinLogs(startDate?: Date, endDate?: Date): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const checkinsCollection = collection(this.firestore, 'checkins');
      let q = query(checkinsCollection, orderBy('checkin_time', 'desc'));

      if (startDate && endDate) {
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);

        q = query(
          checkinsCollection,
          where('checkin_time', '>=', startTimestamp),
          where('checkin_time', '<=', endTimestamp),
          orderBy('checkin_time', 'desc')
        );
      } else if (startDate) {
        const startTimestamp = Timestamp.fromDate(startDate);
        const endOfDay = new Date(startDate);
        endOfDay.setHours(23, 59, 59, 999);
        const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

        q = query(
          checkinsCollection,
          where('checkin_time', '>=', startTimestamp),
          where('checkin_time', '<=', endOfDayTimestamp),
          orderBy('checkin_time', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      this.allCheckinLogs = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any; // Use 'any' temporarily to access timestamp methods
        return {
          id: doc.id,
          name: data['name'],
          role: data['role'],
          // Convert Timestamp to Date using .toDate() method
          checkin_time:
            data['checkin_time'] instanceof Timestamp
              ? data['checkin_time'].toDate()
              : null,
          checkout_time:
            data['checkout_time'] instanceof Timestamp
              ? data['checkout_time'].toDate()
              : null,
          checkin_kiosk_id: data['checkin_kiosk_id'] ?? null,
          checkout_kiosk_id: data['checkout_kiosk_id'] ?? null,
          checkin_status: data['checkin_status'] ?? true,
          uid: data['uid'] ?? undefined, // Include uid if present
        };
      });
      this.filteredCheckinLogs = [...this.allCheckinLogs];
      this.loading = false;
      console.log('Check-in logs fetched:', this.allCheckinLogs);
    } catch (err: any) {
      this.error = `Error fetching check-in logs: ${err.message}`;
      console.error('Error fetching check-in logs:', err);
      this.loading = false;
    }
  }

  fetchCheckinLogsForToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    this.fetchCheckinLogs(today, endOfToday);
  }

  filterLogsByDate(): void {
    if (this.selectedDate) {
      const selectedDateObj = new Date(this.selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      this.fetchCheckinLogs(selectedDateObj, nextDay);
    } else {
      // If the date input is cleared, refetch today's logs
      console.log("Date filter cleared. Refetching today's logs.");
      this.fetchCheckinLogsForToday();
    }
  }

  showLastWeekLogs(): void {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    this.fetchCheckinLogs(lastWeekStart, endOfToday);
  }

  showLastMonthLogs(): void {
    const today = new Date();
    const lastMonthStart = new Date(today);
    lastMonthStart.setMonth(today.getMonth() - 1);
    lastMonthStart.setDate(today.getDate()); // Keep same day
    lastMonthStart.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    this.fetchCheckinLogs(lastMonthStart, endOfToday);
  }

  async checkoutUser(recordId: string): Promise<void> {
    this.error = null;
    console.log('Attempting to check out record ID:', recordId);

    const checkedOutRecord = this.allCheckinLogs.find(
      (log) => log.id === recordId
    );

    if (!checkedOutRecord) {
      console.error(
        'Checkout failed: Could not find local record with ID:',
        recordId
      );
      this.error = 'Error: Record not found locally.';
      return;
    }

    if (
      checkedOutRecord.checkin_status === false ||
      checkedOutRecord.checkout_time !== null
    ) {
      console.warn(
        'Attempted to check out an already checked out record:',
        recordId
      );
      this.error = 'User is already checked out.';
      return;
    }

    const checkinDocRef = doc(this.firestore, 'checkins', recordId);

    try {
      const batch = writeBatch(this.firestore);

      // 1. Update the check-in record in 'checkins'
      const nowForCheckout = new Date(); // Use local date for immediate display update
      batch.update(checkinDocRef, {
        checkout_time: Timestamp.fromDate(nowForCheckout), // Use Timestamp.fromDate for consistency
        checkout_kiosk_id: 'ADMIN_PANEL_CLIENT',
        checkin_status: false,
      });
      console.log(`Batch added update for record ${recordId} in checkins.`);

      // 2. Create the Checkout Alert document in the 'checkoutalerts' collection
      const checkoutAlertsCollection = collection(
        this.firestore,
        'checkoutalerts'
      );
      const newCheckoutAlertRef = doc(checkoutAlertsCollection); // New doc ref with auto ID

      const hours = nowForCheckout.getHours().toString().padStart(2, '0');
      const minutes = nowForCheckout.getMinutes().toString().padStart(2, '0');
      const checkoutTimeFormatted = `${hours}:${minutes}`;

      // Prepare checkout alert data for checkoutalerts collection
      const checkoutAlertData = {
        name: checkedOutRecord.name,
        role: checkedOutRecord.role,
        uid: checkedOutRecord.uid ?? null, // Include UID if available, use null if not
        checkinRecordId: recordId, // Link back to the original checkin record
        checkout_time: Timestamp.fromDate(nowForCheckout), // Use Timestamp.fromDate
        time: checkoutTimeFormatted,
        read: false, // Global read status for this collection (if used)
      };
      batch.set(newCheckoutAlertRef, checkoutAlertData);
      console.log(
        `Batch added set for new checkout alert ${newCheckoutAlertRef.id} in checkoutalerts.`
      );

      // 3. Identify recipients (Admins) and create userAlertStatus records
      const adminRecipients: { uid: string; role: string }[] = [];
      const usersCollection = collection(this.firestore, 'users');

      const adminUsersQuery = query(
        usersCollection,
        where('role', '==', 'admin')
      );
      const adminUsersSnapshot = await getDocs(adminUsersQuery);
      adminUsersSnapshot.docs.forEach((userDoc) => {
        const userData = userDoc.data() as FirestoreUser;
        adminRecipients.push({ uid: userData.uid, role: userData.role });
      });
      console.log(
        `Identified ${adminRecipients.length} admin recipients for checkout alert.`
      );

      const userAlertStatusCollection = collection(
        this.firestore,
        'userAlertStatus'
      );
      adminRecipients.forEach((recipient) => {
        const userStatusRef = doc(userAlertStatusCollection); // Auto ID for status document
        batch.set(userStatusRef, {
          userId: recipient.uid,
          alertId: newCheckoutAlertRef.id, // <-- Link to the checkoutAlerts document ID
          isRead: false,
          sentTimestamp: Timestamp.fromDate(nowForCheckout), // Use Timestamp.fromDate
          alertCollection: 'checkoutalerts', // Explicitly state the collection
        });
      });
      console.log(
        `Batch added set operations for ${adminRecipients.length} admin user status records.`
      );

      // Commit the batch write
      await batch.commit();
      console.log(
        `Batch write committed: Checkout Update, Alert ${newCheckoutAlertRef.id} in checkoutalerts, and ${adminRecipients.length} admin user status records created.`
      );

      // --- Update the local list immediately after successful commit ---
      this.allCheckinLogs = this.allCheckinLogs.map((log) =>
        log.id === recordId
          ? { ...log, checkout_time: nowForCheckout, checkin_status: false } // Update with Date object for local display
          : log
      );
      this.filteredCheckinLogs = this.filteredCheckinLogs.map((log) =>
        log.id === recordId
          ? { ...log, checkout_time: nowForCheckout, checkin_status: false } // Update with Date object for local display
          : log
      );
      console.log(`Record ${recordId} updated locally.`);
    } catch (err: any) {
      this.error = `Error processing checkout: ${err.message}`;
      console.error('Error during checkout process:', err);
      if (err instanceof FirestoreError) {
        console.error(`Firestore Error Code: ${err.code}`);
        if (err.code === 'permission-denied') {
          this.error = 'Permission denied to perform checkout.';
        } else if (err.code === 'unavailable') {
          this.error = 'Cannot connect to database. Check network.';
        }
      }
    }
  }

  printAllLogs(): void {
    window.print();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
